# An MPU6050 driver based on pigpio-client.

MPU6050 IMU Driver for Nodejs based on pigpio-client with i2c, dmp and calibration enabled

it uses a pigpio-client modified for i2c functions.

pigpio allows the use of GPIO, I2C and other hardware functions of the RPi remotely or locally over sockets.

pigpio style daemons exist for other platforms than the Raspberry Pi.

## Install

```
npm install --save github:btsimonh/mpu6050-pigpio-client
```

This depends on github:btsimonh/pigpio-client#Addmorei2c

## Usage

see the [example](./examples/MPU6050-test.js)

Basically, you need to create a pigpio instance.  Once it is connected, call the function returned by requiring this library.  This will create an I2C instance in pigpio, and add the MPU6050 functions to it.

Once the MPU6050 is created, you can then call the functions to operate the MPU6050.

NOTE: The majority of functions are async - since pigpio-client operates over network.  So every register set, etc. involves a network exchange.  If something is not working as expected, double check that all your calls have `await` in front of them! - that was my most common bug!

## Calibration

This library takes a unique (?) approach to calibration.  MPU6050 calibration in the i2cdev library uses a PID loop to 'adjust' the hardware offsets until correct - because the h/w offsets are applied before a h/w scale is applied, and so the offsets cannot be calculated.  

Instead, I have worked out how to *read* the hardware SCALES, and hence obtaining single average of the current readings is enough to determine the correct hardware offsets to apply, by scaling them by the hardware scales.

The h/w offsets (calibration) can be store to file, and then restored each time you start the MPU6050.  Experience will tell if the calibration drifts over time/use.  For my MPU6050, one factory calibrated offset was incorrect by 0.3g - was this because my module was subjected to shock in shipping?

Examine the example with op === 'calibrate' to see how obtaining the calibration offsets is done.

Note although the DMP can have separate offsets set, h/w calibration is useful because it applies to all readings - i.e. those you get direct from the registers, and those obtaind using non-dmp fifo.

However, also note that Gyro calibration seems to vary accoring to orientation at the time of calibration, full analysis not done.  (try calibrating at all 6 orientations, and then running the example with 'csv' to see results in a csv file).  When using the dmp, the dmp is normally configured to calibrate the gyro offsets - they seem to zero out after about 8-10 seconds of dmp runtime.

## reading raw values

Raw values can be read using MPU6050.read() - this returns accelleration, gyro and temperature directly read from the i2c registers.  I would not trust that the values could not be interrupted by a write to the registers during reading.  This only way to ensure that they were not read half way through a write would be to us interrupts - you *could* get a GPIO notification of the hardware interrupt line change via pigpio-client, but as we're in nodejs and possibly remote, I've not bothered to try this.

## reading from fifo

See example for op === 'fifo' for how to read values from the fifo.

Using the fifo, you can guarantee that the data is self-consistent.  You can read accelleration, gyro, temperature, and also external i2c values (fifo read of values tested, but not with values populated from real external i2c devices).

As NodeJS could GC for 200ms, set the sample rate appropriately to avoid a fifo overflow.  If a fifo overflow occurs, the .read_fifo routine will reset the fifo, and return the fact it overflowed.  Reading should continue normally after that.  The example runs at a sample rate of 10hz.

## reading from the dmp

See example for op === 'dmp' for how to configure, then read values from the fifo from the dmp.

The dmp provides quaterions which contain information to create yaw, pitch and roll angles, and integrates values from the highest raw sample rate ( .set_sample_rate(200) ), reducing the rate down to the dmp rate specified.

As NodeJS could GC for 200ms, set the .dmp_set_fifo_rate appropriately to avoid a fifo overflow.  If a fifo overflow occurs, the .dmp_read() routine will reset the fifo, and return the fact it overflowed.  Reading should continue normally after that.  The example runs at a .dmp_set_fifo_rate of 5hz.

## 'packet' format

### fifo
The functions .read_fifo(), and dmp_read() output a structure:
```
{
  overflow: true | false, // indicates fifo overflow - the fifo has been reset
  packets: [p1, p2, ....] // data read - see 'the data' below
}
```

### the data
A 'packet' (also the output of .read() - raw reg read) is like:
```
{
  // for dmp packets:
  pkt_sample_num?: <read from dmp reg (.DMP_COUNTER2_ULONG = 0x1B4) at fifo read, and estimated from there>,
  pkt_ms?: <calculated from dmp fifo rate and pkt_sample_num>,
  pitch: <angle>,  // calculated from q[] if q enabled
  roll: <angle>,
  yaw: <angle>,
  q: [q0, q1, q2, q3], // if enabled
  
  // for dmp/fifo, if enabled, always in raw
  accel_g?: [x, y, z], // accelleraiton in g
  gyro_dps?: [x, y, z], // gyro in degrees per second
  
  // for fifo if enabled, always in raw
  tempdegrees?: <temperature of device>
  
  // for fifo if enabled (it is possible that the code could be modified to get these when the dmp is active..  PRs welcome?
  i2c?:{ 
    slv0?:[d0,d1, ...], // data from slaves if anabled.  data count set using await MPU6050.set_iic_transferred_len(1, count);
    slv1?:[d0,d1, ...],
    slv2?:[d0,d1, ...],
    slv3?:[d0,d1, ...],
    slv4?:[d0,d1, ...],
  }
}
```


## Wiki

See/edit the wiki for further technical information about the MPU6050.


## PRs

PRs welcome, especially for adding additional Invensense devices.

### Missing bits: 

I did not test or implement DMP_FEATURE_3X_QUAT.

I did not test external I2C reading from a device, although reading the data from the fifo is implemented.

Don't ask for dmp features DMP_FEATURE_3X_QUAT and DMP_FEATURE_6X_QUAT at the same time.

Don't ask for dmp features DMP_FEATURE_SEND_CAL_GYRO and DMP_FEATURE_SEND_RAW_GYRO at the same time. (some extra data arrives - not sure what).  The configuration fucntion could do with enforcing these to be exclusive.

# Acknowledgments

The implementation was originally based on [this](https://github.com/hepingood/mpu6050) implementation.  After looking at all the popular implementations, it seemed simple yet complete.  (yet turned out to be incomplete).

It was made possible because of the brilliant work by the writers of [piopiod](https://abyz.me.uk/rpi/pigpio/pigpiod.html), and the implementaiton of [pigpio-client](https://github.com/guymcswain/pigpio-client) by @guymcswain (hopefully he'll merge my i2c enhancements soon...).  

Thanks have to go to all of the people who have written, commented, experimented with the MPU6050.  Correct or complete information is very hard to come by, especially for the dmp aspects.  This project is a result of a lot of reading of conflicting information, and a fair degree of empirical observation and deduction over many weeks.

Special thanks go to the guy who was flamed on a forum (I forget where) for asking if anyone was interested in his findings on the fine scale tuning registers....  without his initial thoughts, the advanced calibration method would not have become a reality, although the implementaiton here is all my own work :).
