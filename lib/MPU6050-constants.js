
function addConstants(MPU6050Inst){

    // debug bitfield bits for log control.
    // set into .debug to enable certain logs.
    MPU6050Inst.DEBUG_FIFO = 1; // enable fifo dump logs


 /**
 * @brief mpu6050 address enumeration definition
 */
    MPU6050Inst.ADDRESS_AD0_LOW = 0xD0;        /**< AD0 pin set LOW */
    MPU6050Inst.ADDRESS_AD0_HIGH = 0xD2;        /**< AD0 pin set HIGH */
/**
 * @brief mpu6050 wake up frequency enumeration definition
 */
    MPU6050Inst.WAKE_UP_FREQUENCY_1P25_HZ = 0x00;        /**< 1.25Hz */
    MPU6050Inst.WAKE_UP_FREQUENCY_5_HZ = 0x01;        /**< 5Hz */
    MPU6050Inst.WAKE_UP_FREQUENCY_20_HZ = 0x02;        /**< 20Hz */
    MPU6050Inst.WAKE_UP_FREQUENCY_40_HZ = 0x03;        /**< 40Hz */

/**
 * @brief mpu6050 bool enumeration definition
 */
    MPU6050Inst.BOOL_FALSE = 0x00;        /**< disable function */
    MPU6050Inst.BOOL_TRUE = 0x01;        /**< enable function */
/**
 * @brief mpu6050 source enumeration definition
 */
    MPU6050Inst.SOURCE_ACC_X = 0x05;        /**< accelerometer x */
    MPU6050Inst.SOURCE_ACC_Y = 0x04;        /**< accelerometer y */
    MPU6050Inst.SOURCE_ACC_Z = 0x03;        /**< accelerometer z */
    MPU6050Inst.SOURCE_GYRO_X = 0x02;        /**< gyroscope x */
    MPU6050Inst.SOURCE_GYRO_Y = 0x01;        /**< gyroscope y */
    MPU6050Inst.SOURCE_GYRO_Z = 0x00;        /**< gyroscope z */

/**
 * @brief mpu6050 clock source enumeration definition
 */
    MPU6050Inst.CLOCK_SOURCE_INTERNAL_8MHZ = 0x00;        /**< internal 8MHz */
    MPU6050Inst.CLOCK_SOURCE_PLL_X_GYRO = 0x01;        /**< pll with x axis gyroscope reference */
    MPU6050Inst.CLOCK_SOURCE_PLL_Y_GYRO = 0x02;        /**< pll with y axis gyroscope reference */
    MPU6050Inst.CLOCK_SOURCE_PLL_Z_GYRO = 0x03;        /**< pll with z axis gyroscope reference */
    MPU6050Inst.CLOCK_SOURCE_PLL_EXT_32P768_KHZ = 0x04;        /**< pll extern 32.768 KHz */
    MPU6050Inst.CLOCK_SOURCE_PLL_EXT_19P2_MHZ = 0x05;        /**< pll extern 19.2 MHz */
    MPU6050Inst.CLOCK_SOURCE_STOP_CLOCK = 0x07;        /**< stop the clock */

/**
 * @brief mpu6050 signal path reset enumeration definition
 */
    MPU6050Inst.SIGNAL_PATH_RESET_TEMP = 0x00;        /**< temperature sensor analog and digital signal paths */
    MPU6050Inst.SIGNAL_PATH_RESET_ACCEL = 0x01;        /**< accelerometer analog and digital signal paths */
    MPU6050Inst.SIGNAL_PATH_RESET_GYRO = 0x02;        /**< gyroscope analog and digital signal paths */

/**
 * @brief mpu6050 extern sync enumeration definition
 */
    MPU6050Inst.EXTERN_SYNC_INPUT_DISABLED = 0x00;        /**< input disabled */
    MPU6050Inst.EXTERN_SYNC_TEMP_OUT_L = 0x01;        /**< temp out low */
    MPU6050Inst.EXTERN_SYNC_GYRO_XOUT_L = 0x02;        /**< gyro xout low */
    MPU6050Inst.EXTERN_SYNC_GYRO_YOUT_L = 0x03;        /**< gyro yout low */
    MPU6050Inst.EXTERN_SYNC_GYRO_ZOUT_L = 0x04;        /**< gyro zout low */
    MPU6050Inst.EXTERN_SYNC_ACCEL_XOUT_L = 0x05;        /**< accel xout low */
    MPU6050Inst.EXTERN_SYNC_ACCEL_YOUT_L = 0x06;        /**< accel yout low */
    MPU6050Inst.EXTERN_SYNC_ACCEL_ZOUT_L = 0x07;        /**< accel zout low */

/**
 * @brief mpu6050 low pass filter enumeration definition
 */
    MPU6050Inst.LOW_PASS_FILTER_0 = 0x00;        /**<      260         1         0          256          8      0.98    */
    MPU6050Inst.LOW_PASS_FILTER_1 = 0x01;        /**<      184         1       2.0          188          1       1.9    */
    MPU6050Inst.LOW_PASS_FILTER_2 = 0x02;        /**<       94         1       3.0           98          1       2.8    */
    MPU6050Inst.LOW_PASS_FILTER_3 = 0x03;        /**<       44         1       4.9           42          1       4.8    */
    MPU6050Inst.LOW_PASS_FILTER_4 = 0x04;        /**<       21         1       8.5           20          1       8.3    */
    MPU6050Inst.LOW_PASS_FILTER_5 = 0x05;        /**<       10         1      13.8           10          1      13.4    */
    MPU6050Inst.LOW_PASS_FILTER_6 = 0x06;        /**<        5         1      19.0            5          1      18.6    */
    MPU6050Inst.LOW_PASS_FILTER_7_RESERVED = 0x07;        /**<        5         1      19.0            5          1      18.6    */

/**
 * @brief mpu6050 axis enumeration definition
 */
    MPU6050Inst.AXIS_Z = 0x05;        /**< z */
    MPU6050Inst.AXIS_Y = 0x06;        /**< y */
    MPU6050Inst.AXIS_X = 0x07;        /**< x */

    MPU6050Inst.AXIS_ALL = 0xFF;        /** */

/**
 * @brief mpu6050 gyroscope range enumeration definition
 */
    MPU6050Inst.GYROSCOPE_RANGE_250DPS = 0x00;        /**< ±250 dps */
    MPU6050Inst.GYROSCOPE_RANGE_500DPS = 0x01;        /**< ±500 dps */
    MPU6050Inst.GYROSCOPE_RANGE_1000DPS = 0x02;        /**< ±1000 dps */
    MPU6050Inst.GYROSCOPE_RANGE_2000DPS = 0x03;        /**< ±2000 dps */

/**
 * @brief mpu6050 accelerometer range enumeration definition
 */
    MPU6050Inst.ACCELEROMETER_RANGE_2G = 0x00;        /**< ±2 g */
    MPU6050Inst.ACCELEROMETER_RANGE_4G = 0x01;        /**< ±4 g */
    MPU6050Inst.ACCELEROMETER_RANGE_8G = 0x02;        /**< ±8 g */
    MPU6050Inst.ACCELEROMETER_RANGE_16G = 0x03;        /**< ±16 g */

/**
 * @brief mpu6050 fifo enumeration definition
 */
    MPU6050Inst.FIFO_SLV3 = 0x08;        /**< i2c slave 2 */
    MPU6050Inst.FIFO_TEMP = 0x07;        /**< temperature */
    MPU6050Inst.FIFO_XG = 0x06;        /**< gyroscope x */
    MPU6050Inst.FIFO_YG = 0x05;        /**< gyroscope y */
    MPU6050Inst.FIFO_ZG = 0x04;        /**< gyroscope z */
    MPU6050Inst.FIFO_ACCEL = 0x03;        /**< accelerometer */
    MPU6050Inst.FIFO_SLV2 = 0x02;        /**< i2c slave 2 */
    MPU6050Inst.FIFO_SLV1 = 0x01;        /**< i2c slave 1 */
    MPU6050Inst.FIFO_SLV0 = 0x00;        /**< i2c slave 0 */

/**
 * @brief mpu6050 pin level enumeration definition
 */
    MPU6050Inst.PIN_LEVEL_HIGH = 0x00;        /**< active low */
    MPU6050Inst.PIN_LEVEL_LOW = 0x01;        /**< active high */

/**
 * @brief mpu6050 pin type enumeration definition
 */
    MPU6050Inst.PIN_TYPE_PUSH_PULL = 0x00;        /**< push pull */
    MPU6050Inst.PIN_TYPE_OPEN_DRAIN = 0x01;        /**< open drain */

/**
 * @brief mpu6050 interrupt enumeration definition
 */
    MPU6050Inst.INTERRUPT_MOTION = 6;        /**< motion */
    MPU6050Inst.INTERRUPT_FIFO_OVERFLOW = 4;        /**< fifo overflow */
    MPU6050Inst.INTERRUPT_I2C_MAST = 3;        /**< i2c master */
    MPU6050Inst.INTERRUPT_DMP = 1;        /**< dmp */
    MPU6050Inst.INTERRUPT_DATA_READY = 0;        /**< data ready */

/**
 * @brief mpu6050 iic slave enumeration definition
 */
    MPU6050Inst.IIC_SLAVE_0 = 0x00;        /**< slave0 */
    MPU6050Inst.IIC_SLAVE_1 = 0x01;        /**< slave1 */
    MPU6050Inst.IIC_SLAVE_2 = 0x02;        /**< slave2 */
    MPU6050Inst.IIC_SLAVE_3 = 0x03;        /**< slave3 */
    MPU6050Inst.IIC_SLAVE_4 = 0x04;        /**< slave4 */

/**
 * @brief mpu6050 iic clock enumeration definition
 */
    MPU6050Inst.IIC_CLOCK_348_KHZ = 0x00;        /**< 348 kHz */
    MPU6050Inst.IIC_CLOCK_333_KHZ = 0x01;        /**< 333 kHz */
    MPU6050Inst.IIC_CLOCK_320_KHZ = 0x02;        /**< 320 kHz */
    MPU6050Inst.IIC_CLOCK_308_KHZ = 0x03;        /**< 308 kHz */
    MPU6050Inst.IIC_CLOCK_296_KHZ = 0x04;        /**< 296 kHz */
    MPU6050Inst.IIC_CLOCK_286_KHZ = 0x05;        /**< 286 kHz */
    MPU6050Inst.IIC_CLOCK_276_KHZ = 0x06;        /**< 276 kHz */
    MPU6050Inst.IIC_CLOCK_267_KHZ = 0x07;        /**< 267 kHz */
    MPU6050Inst.IIC_CLOCK_258_KHZ = 0x08;        /**< 258 kHz */
    MPU6050Inst.IIC_CLOCK_500_KHZ = 0x09;        /**< 500 kHz */
    MPU6050Inst.IIC_CLOCK_471_KHZ = 0x0A;        /**< 471 kHz */
    MPU6050Inst.IIC_CLOCK_444_KHZ = 0x0B;        /**< 444 kHz */
    MPU6050Inst.IIC_CLOCK_421_KHZ = 0x0C;        /**< 421 kHz */
    MPU6050Inst.IIC_CLOCK_400_KHZ = 0x0D;        /**< 400 kHz */
    MPU6050Inst.IIC_CLOCK_381_KHZ = 0x0E;        /**< 381 kHz */
    MPU6050Inst.IIC_CLOCK_364_KHZ = 0x0F;        /**< 364 kHz */

/**
 * @brief mpu6050 iic read mode enumeration definition
 */
    MPU6050Inst.IIC_READ_MODE_RESTART = 0x00;        /**< restart */
    MPU6050Inst.IIC_READ_MODE_STOP_AND_START = 0x01;        /**< stop and start */

/**
 * @brief mpu6050 iic mode enumeration definition
 */
    MPU6050Inst.IIC_MODE_WRITE = 0x00;        /**< write */
    MPU6050Inst.IIC_MODE_READ = 0x01;        /**< read */

/**
 * @brief mpu6050 iic transaction mode enumeration definition
 */
    MPU6050Inst.IIC_TRANSACTION_MODE_DATA = 0x00;        /**< data only */
    MPU6050Inst.IIC_TRANSACTION_MODE_REG_DATA = 0x01;        /**< write a register address prior to reading or writing data */

/**
 * @brief mpu6050 iic4 transaction mode enumeration definition
 */
    MPU6050Inst.IIC4_TRANSACTION_MODE_DATA = 0x00;        /**< data only */
    MPU6050Inst.IIC4_TRANSACTION_MODE_REG = 0x01;        /**< register only */

/**
 * @brief mpu6050 iic group order enumeration definition
 */
    MPU6050Inst.IIC_GROUP_ORDER_EVEN = 0x00;        /**< when cleared to 0; bytes from register addresses 0 and 1; 2 and 3; 
                                                     etc (even; then odd register addresses) are paired to form a word. */
    MPU6050Inst.IIC_GROUP_ORDER_ODD = 0x01;        /**< when set to 1; bytes from register addresses are paired 1 and 2; 3 and 4; 
                                                     etc. (odd; then even register addresses) are paired to form a word. */

/**
 * @brief mpu6050 iic status enumeration definition
 */
    MPU6050Inst.IIC_STATUS_PASS_THROUGH = 0x80;        /**< pass through */
    MPU6050Inst.IIC_STATUS_IIC_SLV4_DONE = 0x40;        /**< slave4 done */
    MPU6050Inst.IIC_STATUS_IIC_LOST_ARB = 0x20;        /**< lost arbitration */
    MPU6050Inst.IIC_STATUS_IIC_SLV4_NACK = 0x10;        /**< slave4 nack */
    MPU6050Inst.IIC_STATUS_IIC_SLV3_NACK = 0x08;        /**< slave3 nack */
    MPU6050Inst.IIC_STATUS_IIC_SLV2_NACK = 0x04;        /**< slave2 nack */
    MPU6050Inst.IIC_STATUS_IIC_SLV1_NACK = 0x02;        /**< slave1 nack */
    MPU6050Inst.IIC_STATUS_IIC_SLV0_NACK = 0x01;        /**< slave0 nack */

/**
 * @brief mpu6050 iic delay enumeration definition
 */
    MPU6050Inst.IIC_DELAY_ES_SHADOW = 7;        /**< delays shadowing of external sensor data until 
                                                 all data has been received */
    MPU6050Inst.IIC_DELAY_SLAVE_4 = 4;        /**< slave 4 */
    MPU6050Inst.IIC_DELAY_SLAVE_3 = 3;        /**< slave 3 */
    MPU6050Inst.IIC_DELAY_SLAVE_2 = 2;        /**< slave 2 */
    MPU6050Inst.IIC_DELAY_SLAVE_1 = 1;        /**< slave 1 */
    MPU6050Inst.IIC_DELAY_SLAVE_0 = 0;        /**< slave 0 */


/**
 * @brief mpu6050 dmp interrupt mode enumeration definition
 */
    MPU6050Inst.DMP_INTERRUPT_MODE_CONTINUOUS = 0x00;        /**< continuous mode */
    MPU6050Inst.DMP_INTERRUPT_MODE_GESTURE = 0x01;        /**< gesture mode */

/**
 * @brief mpu6050 dmp feature enumeration definition
 */
    MPU6050Inst.DMP_FEATURE_TAP = 0x001;        /**< feature tap */
    MPU6050Inst.DMP_FEATURE_ORIENT = 0x002;        /**< feature orient */
    MPU6050Inst.DMP_FEATURE_3X_QUAT = 0x004;        /**< feature 3x quat */
    MPU6050Inst.DMP_FEATURE_PEDOMETER = 0x008;        /**< feature pedometer */
    MPU6050Inst.DMP_FEATURE_6X_QUAT = 0x010;        /**< feature 6x quat */
    MPU6050Inst.DMP_FEATURE_GYRO_CAL = 0x020;        /**< feature gyro cal */
    MPU6050Inst.DMP_FEATURE_SEND_RAW_ACCEL = 0x040;        /**< feature send raw accel */
    MPU6050Inst.DMP_FEATURE_SEND_RAW_GYRO = 0x080;        /**< feature send raw gyro */
    MPU6050Inst.DMP_FEATURE_SEND_CAL_GYRO = 0x100;        /**< feature send cal gyro */

/**
 * @brief mpu6050 dmp tap enumeration definition
 */
    MPU6050Inst.DMP_TAP_X_UP = 0x01;        /**< tap x up */
    MPU6050Inst.DMP_TAP_X_DOWN = 0x02;        /**< tap x down */
    MPU6050Inst.DMP_TAP_Y_UP = 0x03;        /**< tap y up */
    MPU6050Inst.DMP_TAP_Y_DOWN = 0x04;        /**< tap y down */
    MPU6050Inst.DMP_TAP_Z_UP = 0x05;        /**< tap z up */
    MPU6050Inst.DMP_TAP_Z_DOWN = 0x06;        /**< tap z down */

/**
 * @brief mpu6050 dmp orient enumeration definition
 */
    MPU6050Inst.DMP_ORIENT_PORTRAIT = 0x00;        /**< portrait */
    MPU6050Inst.DMP_ORIENT_LANDSCAPE = 0x01;        /**< landscape */
    MPU6050Inst.DMP_ORIENT_REVERSE_PORTRAIT = 0x02;        /**< reverse portrait */
    MPU6050Inst.DMP_ORIENT_REVERSE_LANDSCAPE = 0x03;        /**< reverse landscape */



    /**
     * @brief chip register definition
     */

    // no idea what these are.... (temperature adjust??)
    MPU6050Inst.REG_XGOFFS_TC           = 0x00;  // Bit 7 PWR_MODE, bits 6:1 XG_OFFS_TC, bit 0 OTP_BNK_VLD
    MPU6050Inst.REG_YGOFFS_TC           = 0x01; 
    MPU6050Inst.REG_ZGOFFS_TC           = 0x02; 

    // there is no documentaiton of these
    MPU6050Inst.REG_X_FINE_GAIN         = 0x03;   // [7:0] fine gain
    MPU6050Inst.REG_Y_FINE_GAIN         = 0x04; 
    MPU6050Inst.REG_Z_FINE_GAIN         = 0x05; 

    // these are hardware offsets applied before hardware scale
    // so to set them, you must first calculate the X/Y/Z scale....
    // 16 bit BE. note retain bit zero - it has something to do with temperature adjustment.
    MPU6050Inst.REG_XA_OFFSET_H         = 0x06; 
    MPU6050Inst.REG_XA_OFFSET_L_TC      = 0x07; 
    MPU6050Inst.REG_YA_OFFSET_H         = 0x08; 
    MPU6050Inst.REG_YA_OFFSET_L_TC      = 0x09; 
    MPU6050Inst.REG_ZA_OFFSET_H         = 0x0A; 
    MPU6050Inst.REG_ZA_OFFSET_L_TC      = 0x0B; 

    MPU6050Inst.REG_UNKNOWN_0C          = 0x0C; 

    MPU6050Inst.REG_SELF_TEST_X         = 0x0D;        /**< self test x register */
    MPU6050Inst.REG_SELF_TEST_Y         = 0x0E;        /**< self test y register */
    MPU6050Inst.REG_SELF_TEST_Z         = 0x0F;        /**< self test z register */
    MPU6050Inst.REG_SELF_TEST_A         = 0x10;        /**< self test a register */

    MPU6050Inst.REG_XG_OFFS_USRH        = 0x13;  // User-defined trim values for gyroscope; supported in MPU-6050?
    MPU6050Inst.REG_XG_OFFS_USRL        = 0x14;  // initial values zero.  Not so important if using DMP as it auto-calibrates gyro.
    MPU6050Inst.REG_YG_OFFS_USRH        = 0x15;
    MPU6050Inst.REG_YG_OFFS_USRL        = 0x16;
    MPU6050Inst.REG_ZG_OFFS_USRH        = 0x17;
    MPU6050Inst.REG_ZG_OFFS_USRL        = 0x18;

    MPU6050Inst.REG_SMPRT_DIV           = 0x19;        /**< smprt div register */
    MPU6050Inst.REG_CONFIG              = 0x1A;        /**< configure register */
    MPU6050Inst.REG_GYRO_CONFIG         = 0x1B;        /**< gyro configure register */
    MPU6050Inst.REG_ACCEL_CONFIG        = 0x1C;        /**< accel configure register */

    MPU6050Inst.REG_FF_THR              = 0x1D;         // Free-fall
    MPU6050Inst.REG_FF_DUR              = 0x1E;         // Free-fall 

    MPU6050Inst.REG_MOTION_THRESHOLD    = 0x1F;        // Motion detection threshold bits [7:0]
    MPU6050Inst.REG_MOTION_DURATION     = 0x20;        // Duration counter threshold for motion interrupt generation, 1 kHz rate, LSB = 1 ms

    MPU6050Inst.REG_ZMOT_THR            = 0x21;   // Zero-motion detection threshold bits [7:0]
    MPU6050Inst.REG_ZRMOT_DUR           = 0x22; // Duration counter threshold for zero motion interrupt generation, 16 Hz rate, LSB = 64 ms

    MPU6050Inst.REG_FIFO_EN             = 0x23;        /**< fifo enable register */
    MPU6050Inst.REG_I2C_MST_CTRL        = 0x24;        /**< i2c master ctrl register */
    MPU6050Inst.REG_I2C_SLV0_ADDR       = 0x25;        /**< iic slave0 address register */
    MPU6050Inst.REG_I2C_SLV0_REG        = 0x26;        /**< iic slave0 reg register */
    MPU6050Inst.REG_I2C_SLV0_CTRL       = 0x27;        /**< iic slave0 ctrl register */
    MPU6050Inst.REG_I2C_SLV1_ADDR       = 0x28;        /**< iic slave1 address register */
    MPU6050Inst.REG_I2C_SLV1_REG        = 0x29;        /**< iic slave1 reg register */
    MPU6050Inst.REG_I2C_SLV1_CTRL       = 0x2A;        /**< iic slave1 ctrl register */
    MPU6050Inst.REG_I2C_SLV2_ADDR       = 0x2B;        /**< iic slave2 address register */
    MPU6050Inst.REG_I2C_SLV2_REG        = 0x2C;        /**< iic slave2 reg register */
    MPU6050Inst.REG_I2C_SLV2_CTRL       = 0x2D;        /**< iic slave2 ctrl register */
    MPU6050Inst.REG_I2C_SLV3_ADDR       = 0x2E;        /**< iic slave3 address register */
    MPU6050Inst.REG_I2C_SLV3_REG        = 0x2F;        /**< iic slave3 reg register */
    MPU6050Inst.REG_I2C_SLV3_CTRL       = 0x30;        /**< iic slave3 ctrl register */
    MPU6050Inst.REG_I2C_SLV4_ADDR       = 0x31;        /**< iic slave4 address register */
    MPU6050Inst.REG_I2C_SLV4_REG        = 0x32;        /**< iic slave4 reg register */
    MPU6050Inst.REG_I2C_SLV4_DO         = 0x33;        /**< iic slave4 do register */
    MPU6050Inst.REG_I2C_SLV4_CTRL       = 0x34;        /**< iic slave4 ctrl register */
    MPU6050Inst.REG_I2C_SLV4_DI         = 0x35;        /**< iic slave4 di register */
    MPU6050Inst.REG_I2C_MST_STATUS      = 0x36;        /**< i2c master status register */
    MPU6050Inst.REG_INT_PIN_CFG         = 0x37;        /**< interrupt pin configure register */
    MPU6050Inst.REG_INT_ENABLE          = 0x38;        /**< interrupt enable register */
    MPU6050Inst.REG_INT_STATUS          = 0x3A;        /**< interrupt status register */

    MPU6050Inst.REG_ACCEL_XOUT_H        = 0x3B;        /**< accel xout high register */
    MPU6050Inst.REG_ACCEL_XOUT_L        = 0x3C;        /**< accel xout low register */
    MPU6050Inst.REG_ACCEL_YOUT_H        = 0x3D;        /**< accel yout high register */
    MPU6050Inst.REG_ACCEL_YOUT_L        = 0x3E;        /**< accel yout low register */
    MPU6050Inst.REG_ACCEL_ZOUT_H        = 0x3F;        /**< accel zout high register */
    MPU6050Inst.REG_ACCEL_ZOUT_L        = 0x40;        /**< accel zout low register */

    MPU6050Inst.REG_TEMP_OUT_H          = 0x41;        /**< temp high register */
    MPU6050Inst.REG_TEMP_OUT_L          = 0x42;        /**< temp low register */

    MPU6050Inst.REG_GYRO_XOUT_H         = 0x43;        /**< gyro xout high register */
    MPU6050Inst.REG_GYRO_XOUT_L         = 0x44;        /**< gyro xout low register */
    MPU6050Inst.REG_GYRO_YOUT_H         = 0x45;        /**< gyro yout high register */
    MPU6050Inst.REG_GYRO_YOUT_L         = 0x46;        /**< gyro yout low register */
    MPU6050Inst.REG_GYRO_ZOUT_H         = 0x47;        /**< gyro zout high register */
    MPU6050Inst.REG_GYRO_ZOUT_L         = 0x48;        /**< gyro zout low register */
    MPU6050Inst.REG_EXT_SENS_DATA_00    = 0x49;        /**< extern sensor data 00 register */

    MPU6050Inst.REG_I2C_SLV0_DO         = 0x63;        /**< iic slave0 do register */
    MPU6050Inst.REG_I2C_SLV1_DO         = 0x64;        /**< iic slave1 do register */
    MPU6050Inst.REG_I2C_SLV2_DO         = 0x65;        /**< iic slave2 do register */
    MPU6050Inst.REG_I2C_SLV3_DO         = 0x66;        /**< iic slave3 do register */
    MPU6050Inst.REG_I2C_MST_DELAY_CTRL  = 0x67;        /**< i2c master delay ctrl register */
    MPU6050Inst.REG_SIGNAL_PATH_RESET   = 0x68;        /**< signal path reset register */
    MPU6050Inst.REG_USER_CTRL           = 0x6A;        /**< user ctrl register */
    MPU6050Inst.REG_PWR_MGMT_1          = 0x6B;        /**< power mangement 1 register */
    MPU6050Inst.REG_PWR_MGMT_2          = 0x6C;        /**< power mangement 2 register */

    MPU6050Inst.REG_BANK_SEL            = 0x6D;        /**< bank sel register 16 bit BE*/
    MPU6050Inst.REG_MEM                 = 0x6F;        /**< memory register */
    MPU6050Inst.REG_PROGRAM_START       = 0x70;        /**< program start register 16 but BE */
    MPU6050Inst.REG_FIFO_COUNTH         = 0x72;        /**< fifo count high threshold register */
    MPU6050Inst.REG_FIFO_COUNTL         = 0x73;        /**< fifo count low threshold register */
    MPU6050Inst.REG_R_W                 = 0x74;        /**< fifo read write data register */
    MPU6050Inst.REG_WHO_AM_I            = 0x75;        /**< who am I register */

    // end of registers.....


    // helper arrays - the multipliers to apply for the ranges foe accelleration and gyro...
    MPU6050Inst.RANGE_TO_ACC_MULT = [16384, 8192, 4096, 2048];
    MPU6050Inst.RANGE_TO_GYRO_MULT = [131, 65.5, 32.8, 16.4];
    MPU6050Inst.RANGE_TO_ACC_FS = [2, 4, 8, 16]; // full scale in g
    MPU6050Inst.RANGE_TO_GYRO_FS = [250, 500, 1000, 2000]; // full scale in Deg/S (dps)

    MPU6050Inst.I2C_SLAVE_TO_DO = [
        MPU6050Inst.REG_I2C_SLV0_DO, 
        MPU6050Inst.REG_I2C_SLV1_DO, 
        MPU6050Inst.REG_I2C_SLV2_DO, 
        MPU6050Inst.REG_I2C_SLV3_DO, 
        MPU6050Inst.REG_I2C_SLV4_DO
    ];
    MPU6050Inst.I2C_SLAVE_TO_CTRL = [
        MPU6050Inst.REG_I2C_SLV0_CTRL, 
        MPU6050Inst.REG_I2C_SLV1_CTRL, 
        MPU6050Inst.REG_I2C_SLV2_CTRL, 
        MPU6050Inst.REG_I2C_SLV3_CTRL, 
        MPU6050Inst.REG_I2C_SLV4_CTRL
    ];
    MPU6050Inst.I2C_SLAVE_TO_ADDR = [
        MPU6050Inst.REG_I2C_SLV0_ADDR, 
        MPU6050Inst.REG_I2C_SLV1_ADDR, 
        MPU6050Inst.REG_I2C_SLV2_ADDR, 
        MPU6050Inst.REG_I2C_SLV3_ADDR, 
        MPU6050Inst.REG_I2C_SLV4_ADDR
    ];
    MPU6050Inst.I2C_SLAVE_TO_REG = [
        MPU6050Inst.REG_I2C_SLV0_REG, 
        MPU6050Inst.REG_I2C_SLV1_REG, 
        MPU6050Inst.REG_I2C_SLV2_REG, 
        MPU6050Inst.REG_I2C_SLV3_REG, 
        MPU6050Inst.REG_I2C_SLV4_REG
    ];

    // the multiplier to use for hardware offsets - but this must be scaled by the MEASURED
    // hardware scale factors.
    MPU6050Inst.ACC_HW_OFFSET_MULT = 2048;
    MPU6050Inst.GYRO_HW_OFFSET_MULT = 32.8; // ?? is this right - need to confirm.
    
}

module.exports = addConstants;
