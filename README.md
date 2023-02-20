# An MPU6050 driver based on pigpio-client.

MPU6050 IMU Driver for Nodejs based on pigpio-client with i2c, dmp and calibration enabled

it uses a pigpio-client modified for i2c functions.

pigpio allows the use of GPIO, I2C and other hardware functions of the RPi remotely or locally over sockets.

pigpio style daemons exist for other platforms thatn the Raspberry Pi.

# Install

```
npm install --save github:btsimonh/mpu6050-pigpio-client
```

This depends on github:btsimonh/pigpio-client#Addmorei2c

# Usage

see the [example](./examples/MPU6050-test.js)

Basically, you need to create a pigpio instance.  Once it is connected, call the function returned by requiring this library.  This will create an I2C instance in pigpio, and add the MPU6050 functions to it.

Once the MPU6050 is created, you can then call the functions to operate the MPU6050.

# Calibration

This library takes a unique (?) approach to calibration.  MPU6050 calibration in the i2cdev library uses a PID loop to 'adjust' the hardware offsets until correct - because the h/w offsets are applied before a h/w scale is applied.  Here, instead, I have worked out how to read the hardware SCALES, and hence obtaining single average of the current readings is enough to determine the correct hardware offsets to apply.

The h/w offsets (calibration) can be store to file, and then rerstored each time you start the MPU6050.

Examine the example with op === 'calibrate' to see how obtaining the calibration offsets is done.

Note although the DMP can have separate offsets set, h/w calibration is useful because it applies to all readings.

However, also note that Gyro calibration seems to vary accoring to orientation at the time of calibration, full analysis not done.  (try calibrating at all 6 orientations, and then running the example with 'csv' to see results in a csv file).

# reading raw values

Raw values can be read using MPU6050.read() - this returns accelleration, gyro and temperature directly read from the i2c registers.  I would not trust that the values could not be interrupted by a write to the registers during reading.

# reading from fifo

See example for op === 'fifo' for how to read values from the fifo.

Using the fifo, you can guarantee that the data is self-consistent.  You can read accelleration, gyro, temperature, and also external i2c values.

# dmp

See example for op === 'dmp' for how to read values from the fifo from the dmp.

The dmp provides quaterions which contain information to create yaw, pitch and roll angles, and integrates values from the highest raw sample rate, reducing the rate down to the dmp rate specified.

# Wiki

See/edit the wiki for further technical information about the MPU6050.


# PRs

PRs welcome, especially for adding additional Invensense devices.
