

function addBase(MPU6050Inst){

    MPU6050Inst.debug = 0; // bitfield to control logs

    // variables
    MPU6050Inst.inited = 0;
    MPU6050Inst.dmp_inited = 0;
    MPU6050Inst.sample_rate = 200;
    MPU6050Inst.gyro_rate = 8000;

    // ensure to always have these up to date, so we don't need to read them
    MPU6050Inst.accScale = MPU6050Inst.RANGE_TO_ACC_MULT[0];
    MPU6050Inst.gyroScale = MPU6050Inst.RANGE_TO_GYRO_MULT[0];

    // reset the device
    MPU6050Inst.init = async function () {
        let prev = await this.readByteData(this.REG_WHO_AM_I);
    
        if (prev != 0x68)                                                               /* check the id */ {
            console.error('not device 0x68 -> 0x'+prev.toString(16));
            return 5;                                                                   /* return error */
        }
    
        prev = 1 << 7;                                                                  /* reset the device */ 
        await this.writeByteData(this.REG_PWR_MGMT_1, prev);
    
        let timeout = 100;                                                                  /* set the timeout 1000 ms */
        while (timeout != 0)                                                            /* check the timeout */ {
            let prev = await this.readByteData(this.REG_PWR_MGMT_1);
            if ((prev & (1 << 7)) == 0)                                                 /* check the result */ {
                this.inited = 1;                                                     /* flag the inited bit */
                this.dmp_inited = 0;                                                 /* flag closed */
                await this.getScales();
                return 0;                                                               /* success return 0 */
            }
            await this.wait_ms(10);                                                       /* delay 10 ms */
            timeout--;                                                                  /* timeout-- */
        }
    
        console.log("mpu6050: reset failed.\n");                                /* reset failed */
        return 4;                                                                       /* return error */
    };
   
    // power down the device.
    MPU6050Inst.deinit = async function () {
        let prev = (1 << 6) | (1 << 3) | (7 << 0);                                          /* enter sleep mode */ 
        await this.writeByteData(this.REG_PWR_MGMT_1, prev);
        this.inited = 0;                                                             /* flag closed */
        this.dmp_inited = 0;                                                         /* flag closed */
        return 0;                                                                       /* success return 0 */
    };

    // some basic defaults.... to save a lot of typing if you don't need to change much
    MPU6050Inst.init_defaults = async function () {
        await this.set_sleep(false);
        await this.set_clock_source(this.CLOCK_SOURCE_PLL_X_GYRO);
        await this.set_sample_rate(25);
        await this.set_low_pass_filter(this.LOW_PASS_FILTER_3);
        await this.set_temperature_sensor(1);
        await this.set_cycle_wake_up(0);
        await this.set_wake_up_frequency(this.WAKE_UP_FREQUENCY_1P25_HZ);
        await this.set_standby_mode_all(0);
        await this.set_gyroscope_test_all(0);
        await this.set_accelerometer_test_all(0);
        await this.set_fifo(0);
        await this.set_fifo_enable(this.FIFO_TEMP, 0);
        await this.set_fifo_enable_gyro(0);
        await this.set_fifo_enable(this.FIFO_ACCEL, 0);
        await this.set_interrupt_level(this.PIN_LEVEL_LOW);
        await this.set_interrupt_pin_type(this.PIN_TYPE_PUSH_PULL);
        await this.set_interrupt(this.INTERRUPT_MOTION, 0);
        await this.set_interrupt(this.INTERRUPT_FIFO_OVERFLOW, 0);
        await this.set_interrupt(this.INTERRUPT_DMP, 0);
        await this.set_interrupt(this.INTERRUPT_I2C_MAST, 0);
        await this.set_interrupt(this.INTERRUPT_DATA_READY, 0);
        await this.set_interrupt_latch(1);
        await this.set_interrupt_read_clear(1);
        await this.set_extern_sync(this.EXTERN_SYNC_INPUT_DISABLED);
        await this.set_fsync_interrupt(0);
        await this.set_fsync_interrupt_level(this.PIN_LEVEL_LOW);
        await this.set_iic_master(0);
        await this.set_iic_bypass(0);
        await this.set_accelerometer_range(this.ACCELEROMETER_RANGE_2G);
        await this.set_gyroscope_range(this.GYROSCOPE_RANGE_2000DPS);
        await this.getScales();
    };

    // simple awaitable timer.
    MPU6050Inst.wait_ms =function(ms) {
        return new Promise(resolve => {
            setTimeout(() => { resolve('') }, ms);
        });
    },

    MPU6050Inst.getScales = async function () {
        let accel_conf = await this.readByteData(this.REG_ACCEL_CONFIG);
        let gyro_conf = await this.readByteData(this.REG_GYRO_CONFIG);
        accel_conf = (accel_conf >> 3) & 0x3;                                                          /* get the accel conf */
        gyro_conf = (gyro_conf >> 3) & 0x3;                                                            /* get the gyro conf */
       
        this.accScale = this.RANGE_TO_ACC_MULT[accel_conf];
        this.gyroScale = this.RANGE_TO_GYRO_MULT[gyro_conf]; 
    };

    MPU6050Inst.dumpregs = async function (txt, reg, len) {
        let mem = [];
        for (let i = 0; i < len; i++) {
            mem.push(await this.readByteData(reg + i));
        }
    
        for (let i = reg; i < reg+len; i += 16) {
            txt += '\n' + ('000' + i.toString(16)).slice(-4) + ': ';
            for (let j = i; j < i + 16 && j < mem.length; j++) {
                txt += ('0' + mem[j].toString(16)).slice(-2) + ' ';
            }
        }
    
        txt += '\n';
        return txt;
    }
    
    MPU6050Inst.dumparr = function (txt, mem) {
        for (let i = 0; i < mem.length; i += 16) {
            txt += '\n' + ('000' + i.toString(16)).slice(-4) + ': ';
            for (let j = i; j < i + 16 && j < mem.length; j++) {
                txt += ('0' + mem[j].toString(16)).slice(-2) + ' ';
            }
        }
    
        txt += '\n';
        return txt;
    }
    

    // read raw data from regs only
    MPU6050Inst.read = async function () {
        let accel_raw = [];
        let gyro_raw = [];
        let accel_g = [];
        let gyro_dps = [];
        let temp = 0;
   
        let out = {};

        let buf = await this.readI2cBlockData(this.REG_ACCEL_XOUT_H, 14);

        let posn = 0;
        accel_raw.push(this.readInt16BE(buf, posn)); posn+=2;
        accel_raw.push(this.readInt16BE(buf, posn)); posn+=2;
        accel_raw.push(this.readInt16BE(buf, posn)); posn+=2;
        for (let i = 0; i < 3; i++) {
            accel_g.push(accel_raw[i]/this.accScale);
        }
        out.accel_g = accel_g;
        temp = this.readInt16BE(buf, posn); posn+=2;
        out.tempdegrees = (temp / 340.0) + 36.53;
        gyro_raw.push(this.readInt16BE(buf, posn)); posn+=2;                /* set raw gyro x */
        gyro_raw.push(this.readInt16BE(buf, posn)); posn+=2;                /* set raw gyro x */
        gyro_raw.push(this.readInt16BE(buf, posn)); posn+=2;                /* set raw gyro x */
        for (let i = 0; i < 3; i++) {
            gyro_dps.push(gyro_raw[i]/this.gyroScale);
        }
        out.gyro_dps = gyro_dps;
        return out; 
    };

    // read the fifo, return array of entries
    // this is for non-dmp fifo read
    MPU6050Inst.read_fifo = async function () {
        let out = {
            overflow: false, 
            packets: []
        };
    
        let overflow = await this.get_reg_bit(this.REG_INT_STATUS, this.INTERRUPT_FIFO_OVERFLOW);
        if (overflow) {
            console.log("mpu6050: fifo overflow.");                                                                 /* fifo overflow */
            await this.reset_fifo();                                                                               /* reset the fifo */
            out.overflow = true;
            return out;
        }

        let count = await this.readWordDataBE(this.REG_FIFO_COUNTH);
        if (count >= 1024){
            console.log("mpu6050: fifo count 1024.");                                                                 /* fifo overflow */
            await this.reset_fifo();                                                                               /* reset the fifo */
            out.overflow = true;
            return out;
        }

        let mask_temp = (1<<this.FIFO_TEMP);
        let mask_acc = (1<<this.FIFO_ACCEL);
        let mask_g = [];
        mask_g.push(1<<this.FIFO_XG);
        mask_g.push(1<<this.FIFO_YG);
        mask_g.push(1<<this.FIFO_ZG);
        let mask_i2c = [];
        mask_i2c.push(1<<this.FIFO_SLV0);
        mask_i2c.push(1<<this.FIFO_SLV1);
        mask_i2c.push(1<<this.FIFO_SLV2);
        mask_i2c.push(1<<this.FIFO_SLV3);
        

        let len = 0;
        if (this.fifo_enable & mask_acc) len += 6;
        if (this.fifo_enable & mask_temp) len += 2;
        for (a = 0; a < 3; a++){
            if (this.fifo_enable & mask_g[a]) len += 2;
        }

        for (a = 0; a < 4; a++){
            if (this.fifo_enable & mask_i2c[a]) {
                len += this.i2cLen[a];
            }
        }
        
        
        // make a multiple of 12
        let packets = (count / len) >> 0;
        let readcount = packets * len;
        if (readcount !== count){
            out.lenmismatch = true;
        }
        // non-incrementing repeated read of 32 byte chunks
        let buf = await this.readBigI2cBlockData(this.REG_R_W, readcount, false);
        if (buf.length !== readcount){
            // should never happen
            console.error('read len mismatch');
        }

        if (this.debug & this.DEBUG_FIFO){
            console.log('fifo count ' + readcount + ' of '+ count+ ' pktlen ' + len);
            if (this.debug & this.DEBUG_FIFO_DUMP){
                console.log(this.dumparr('Fifo Content', buf));
            }
        }

        // len is 
        for (let i = 0; i < packets; i++) {
            let accel_raw = [];
            let gyro_raw = [];
            let accel_g = [];
            let gyro_dps = [];
            let i2c = {};
            let p = {};

            let posn = i * len;
            if (this.fifo_enable & mask_acc){
                for (a = 0; a < 3; a++){
                    accel_raw.push(this.readInt16BE(buf, posn));
                    accel_g.push(accel_raw[a]/this.accScale);
                    posn += 2
                }
                p.accel_g = accel_g;
            }
            if (this.fifo_enable & mask_temp){
                let temp = this.readInt16BE(buf, posn); 
                posn += 2;
                p.tempdegrees = (temp / 340.0) + 36.53;
            }

            for (a = 0; a < 3; a++){
                if (this.fifo_enable & mask_g[a]){
                    gyro_raw.push(this.readInt16BE(buf, posn));                                   /* set raw gyro x */
                    gyro_dps.push(gyro_raw[a]/this.gyroScale);
                    posn += 2;
                }
            }

            for (a = 0; a < 4; a++){
                if (this.fifo_enable & mask_i2c[a]){
                    i2c['slv'+a] = [];
                    for (let p = 0; p < this.i2cLen[a]; p++){
                        i2c['slv'+a].push(buf[posn]);
                        posn++;
                    }
                    p.i2c = i2c;
                }
            }
            
            if (gyro_dps.length){
                p.gyro_dps = gyro_dps;
            }

            out.packets.push(p);
        }
        return out;
    };

    // helpers for accessing BE data in arrays/buffers, mainly for fifo & dmp access
    // read a 16 bit signed BE value from an array/buffer
    MPU6050Inst.readInt16BE = function(b, i){
        i = i || 0;
        let value = ((b[i] & 0xff)<<8) | (b[i+1] & 0xff);
        if (value > 0x7fff)
          value = value - 0x10000;
        return value;
    };

    // read a 16 bit unsigned BE value from an array/buffer
    MPU6050Inst.readUInt16BE = function(b, i){
        i = i || 0;
        let value = ((b[i] & 0xff)<<8) | (b[i+1] & 0xff);
        return value;
    };

    // read a 32 bit signed BE value from an array/buffer
    MPU6050Inst.readInt32BE = function(b, i){
        i = i || 0;
        let value = ((b[i] & 0xff)<<24) | ((b[i+1] & 0xff)<<16) | ((b[i+2] & 0xff)<<8) | (b[i+3] & 0xff);
        if (value > 0x7fffffff)
            value = value - 0x100000000;
        return value;
    };

    // read a 32 bit unsigned BE value from an array/buffer
    MPU6050Inst.readUInt32BE = function(b, i){
        i = i || 0;
        let value = ((b[i] & 0xff)<<24) | ((b[i+1] & 0xff)<<16) | ((b[i+2] & 0xff)<<8) | (b[i+3] & 0xff);
        return value;
    };

    // fill or create a 2 byte array from a 16 bit value.
    // +ve or -ve
    MPU6050Inst.int16BEToArr = function(val, b, i){
        b = b || [0,0];
        i = i || 0;
        if (val < 0) val += 0x10000;
        b[i] = (val >> 8) & 0xff;
        b[i+1] = (val) & 0xff;
        return b;
    };

    // fill or create a 2 byte array from a 32 bit value.
    // +ve or -ve
    MPU6050Inst.int32BEToArr = function(val, b, i){
        b = b || [0, 0, 0, 0];
        i = i || 0;
        if (val < 0) val += 0x100000000;
        b[i] = (val >> 24) & 0xff;
        b[i+1] = (val >> 16) & 0xff;
        b[i+2] = (val >> 8) & 0xff;
        b[i+3] = (val) & 0xff;
        return b;
    };

    // convert q14 to float.
    MPU6050Inst.q14ToFloat = function(val32){
        return val32/0x40000000;
    };

    // convert q14BE in buffer or array to float.
    MPU6050Inst.readQ14ToFloat = function(b, i){
        i = i || 0;
        let value = ((b[i] & 0xff)<<24) | ((b[i+1] & 0xff)<<16) | ((b[i+2] & 0xff)<<8) | (b[i+3] & 0xff);
        if (value > 0x7fffffff)
            value = value - 0x100000000;
        return value/0x40000000;
    };

    // set a bit in a register.  set force to set even if it would not change.
    MPU6050Inst.set_reg_bit = async function (reg, bit, val, force) {
        let prev = await this.readByteData(reg);
        let org = prev;
        prev &= ~(1 << bit);                                                                   /* clear config */
        if (!val) val = 0; else val = 1;
        let newbyte = prev | (val << bit);                                                                 /* set config */
        if (force || (newbyte !== org)) {
            await this.writeByteData(reg, newbyte);
        }
    };
    
    MPU6050Inst.get_reg_bit = async function (reg, bit) {
        let prev = await this.readByteData(reg);
        let enable = (prev >> bit) & (0x1);                                  /* get bool */
        return enable; 
    };

    // set bits in a register.  set force to set even if it would not change.
    // bit should be the LSB of the value.  bits the bit count
    MPU6050Inst.set_reg_bits = async function (reg, bit, bits, val, force) {
        let prev = await this.readByteData(reg);
        let org = prev;
        let mask = ~(0xff << bits);
        prev &= ~(mask << bit);
        val = val & mask; // limit val
        let newbyte = prev | (val << bit);
        if (force || (newbyte !== org)) {
            await this.writeByteData(reg, newbyte);
        }
    };
    
    MPU6050Inst.get_reg_bits = async function (reg, bit, bits) {
        let prev = await this.readByteData(reg);
        let mask = ~(0xff << bits);
        let enable = (prev >> bit) & (mask);                                  /* get bool */
        return enable; 
    };
    

    MPU6050Inst.reset_fifo = async function() {
        let count = await this.get_fifo_count();
        console.log('reset fifo with count '+count);
    
        let int_enable = await this.readByteData(this.REG_INT_ENABLE);
        let fifo_enable = await this.readByteData(this.REG_FIFO_EN);
        let user_ctrl = await this.readByteData(this.REG_USER_CTRL);
        await this.writeByteData(this.REG_INT_ENABLE, 0);
        await this.writeByteData(this.REG_FIFO_EN, 0);
        user_ctrl &= ~(1 << 6);                                                              /* disable the fifo */
        user_ctrl &= ~(1 << 7);                                                              /* disable the dmp */
        if (this.dmp_inited === 1)                                                         /* if use dmp */ {
            user_ctrl |= (1 << 2) | (1 << 3);                                                /* reset the fifo and dmp */
        } else {
            user_ctrl |= 1 << 2;                                                             /* reset the fifo */
        }
        await this.writeByteData(this.REG_USER_CTRL, user_ctrl);
        await this.wait_ms(50);
        if (this.dmp_inited === 1)                                                         /* if use dmp */ {
            user_ctrl |= (1 << 6) | (1 << 7);                                                /* enable fifo and dmp */
        } else {
            user_ctrl |= 1 << 6;                                                             /* enable fifo */
        }
        await this.writeByteData(this.REG_USER_CTRL, user_ctrl);
        await this.writeByteData(this.REG_INT_ENABLE, int_enable);
        await this.writeByteData(this.REG_FIFO_EN, fifo_enable);
    
        count = await this.get_fifo_count();
        console.log('after reset fifo with count ' + count);
            return 0;                                                                            /* success return 0 */
    };


    MPU6050Inst.set_fifo = async function (enable) {        await this.set_reg_bit(this.REG_USER_CTRL, 6, enable); };
    MPU6050Inst.get_fifo = async function () {              return await this.get_reg_bit(this.REG_USER_CTRL, 6); };
    MPU6050Inst.force_fifo_reset = async function () {      await this.reset_fifo(); };
    MPU6050Inst.set_iic_master = async function (enable) {  await this.set_reg_bit(this.REG_USER_CTRL, 5, enable); };
    MPU6050Inst.get_iic_master = async function () {        return await this.get_reg_bit(this.REG_USER_CTRL, 5); };
    MPU6050Inst.fifo_reset = async function () {            await this.set_reg_bit(this.REG_USER_CTRL, 2, 1, true); };
    MPU6050Inst.get_fifo_reset = async function () {        return await this.get_reg_bit(this.REG_USER_CTRL, 2); };
    MPU6050Inst.iic_master_reset = async function () {      await this.set_reg_bit(this.REG_USER_CTRL, 1, 1); };
    MPU6050Inst.get_iic_master_reset = async function () {  return await this.get_reg_bit(this.REG_USER_CTRL, 1); };
    MPU6050Inst.sensor_reset = async function () {          await this.set_reg_bit(this.REG_USER_CTRL, 0, 1, true); };
    MPU6050Inst.get_sensor_reset = async function () {      return await this.get_reg_bit(this.REG_USER_CTRL, 0); };
    MPU6050Inst.device_reset = async function () {          await this.set_reg_bit(this.REG_PWR_MGMT_1, 7, 1, true); };
    MPU6050Inst.get_device_reset = async function () {      return await this.get_reg_bit(this.REG_PWR_MGMT_1, 7); };
    
    // 3  bit value
    MPU6050Inst.set_clock_source = async function (clock_source) { await this.set_reg_bits(this.REG_PWR_MGMT_1, 0, 3, clock_source); };
    MPU6050Inst.get_clock_source = async function () { return await this.get_reg_bits(this.REG_PWR_MGMT_1, 0, 3); };

    // note inverted!!!
    MPU6050Inst.set_temperature_sensor = async function (enable) { await this.set_reg_bit(this.REG_PWR_MGMT_1, 3, !enable); };
    MPU6050Inst.get_temperature_sensor = async function () { return ! await this.get_reg_bit(this.REG_PWR_MGMT_1, 3); };
    MPU6050Inst.set_cycle_wake_up = async function (enable) { await this.set_reg_bit(this.REG_PWR_MGMT_1, 5, enable); };
    MPU6050Inst.get_cycle_wake_up = async function () { return await this.get_reg_bit(this.REG_PWR_MGMT_1, 5); };
    
    MPU6050Inst.set_sleep = async function (enable) { await this.set_reg_bit(this.REG_PWR_MGMT_1, 6, enable); };
    MPU6050Inst.get_sleep = async function () { return await this.get_reg_bit(this.REG_PWR_MGMT_1, 6); };
    
    MPU6050Inst.set_standby_mode = async function (source, enable) { await this.set_reg_bit(this.REG_PWR_MGMT_2, source, enable); };
    MPU6050Inst.get_standby_mode = async function (source) { return await this.get_reg_bit(this.REG_PWR_MGMT_2, source); };

    MPU6050Inst.set_standby_mode_all = async function (enable) { 
        let val = 0;
        if (enable) val = 0x3f;
        await this.set_reg_bits(this.REG_PWR_MGMT_2, 0, 6, val); 
    };

    // 2  bit value
    MPU6050Inst.set_wake_up_frequency = async function (frequency) { await this.set_reg_bits(this.REG_PWR_MGMT_2, 6, 2, frequency); };
    MPU6050Inst.get_wake_up_frequency = async function () { return await this.get_reg_bits(this.REG_PWR_MGMT_2, 6, 2); };
    MPU6050Inst.get_fifo_count = async function () { return await this.readWordDataBE(this.REG_FIFO_COUNTH); };
    MPU6050Inst.fifo_get = async function (len) { return await this.readBigI2cBlockData(this.REG_R_W, len); };
    MPU6050Inst.fifo_set = async function (buf) { await this.writeBigI2cBlockData(this.REG_R_W, buf); };
    
    MPU6050Inst.set_signal_path_reset = async function (path) { await this.set_reg_bit(this.REG_SIGNAL_PATH_RESET, path, 1, true); };
    
    MPU6050Inst.set_sample_rate_divider = async function (div) {
        let newrate = this.gyro_rate/(1+div);
        this.sample_rate = newrate;
        this.sample_period_ms = (1/newrate)*1000;
        await this.writeByteData(this.REG_SMPRT_DIV, div); 
    };
    MPU6050Inst.get_sample_rate_divider = async function () { 
        let div = await this.readByteData(this.REG_SMPRT_DIV); 
        let newrate = this.gyro_rate/(1+div);
        this.sample_rate = newrate;
        this.sample_period_ms = (1/newrate)*1000;
        return div;
    };

    /*
    The Sample Rate is generated by dividing the gyroscope output rate by SMPLRT_DIV:
    Sample Rate = Gyroscope Output Rate / (1 + SMPLRT_DIV)
    where Gyroscope Output Rate = 8kHz when the DLPF is disabled (DLPF_CFG = 0 or 7), and 1kHz
    when the DLPF is enabled (see Register 26)

    therefore if DPLF, 
    Gyroscope Output Rate/Sample Rate - 1 = SMPLRT_DIV

    */
    MPU6050Inst.set_sample_rate = async function (hz) { 
        let div = Math.round((this.gyro_rate/hz) - 1) & 0xff;
        let newrate = this.gyro_rate/(1+div);
        this.sample_rate = newrate;
        this.sample_period_ms = (1/newrate)*1000;
        await this.writeByteData(this.REG_SMPRT_DIV, div);

        this.DMP_GYRO_SF = (46850825 * 200 / this.sample_rate)        /**< gyro sf */
        return newrate;
    };
    MPU6050Inst.get_sample_rate = async function () { return (1000/(await this.readByteData(this.REG_SMPRT_DIV))) + 1; };

    // 3 bit value
    MPU6050Inst.set_extern_sync = async function (sync) { await this.set_reg_bits(this.REG_PWR_MGMT_2, 3, 3, sync); };
    MPU6050Inst.get_extern_sync = async function () { return await this.get_reg_bits(this.REG_CONFIG, 3, 3); };

    // 3 bit value
    MPU6050Inst.set_low_pass_filter = async function (filter) {
        if ((this.LOW_PASS_FILTER_0 === filter) || (this.LOW_PASS_FILTER_7_RESERVED === filter)){
            this.gyro_rate = 8000;
        } else {
            this.gyro_rate = 1000;
        }
        await this.set_reg_bits(this.REG_CONFIG, 0, 3, filter); 
    };
    MPU6050Inst.get_low_pass_filter = async function () { 
        let filter = await this.get_reg_bits(this.REG_CONFIG, 0, 3); 
        if ((this.LOW_PASS_FILTER_0 === filter) || (this.LOW_PASS_FILTER_7_RESERVED === filter)){
            this.gyro_rate = 8000;
        } else {
            this.gyro_rate = 1000;
        }
        return filter;
    };
    
    MPU6050Inst.set_gyroscope_test = async function (axis, enable) { await this.set_reg_bit(this.REG_GYRO_CONFIG, axis, enable); };
    MPU6050Inst.get_gyroscope_test = async function (axis) { return await this.get_reg_bit(this.REG_GYRO_CONFIG, axis); };
    MPU6050Inst.set_gyroscope_test_all = async function (enable) { 
        let val = 0;
        if (enable) val = 7; // 3 bits starting bit 5
        await this.set_reg_bits(this.REG_GYRO_CONFIG, 5, 3, val); 
    };
    
    // 2 bit value
    MPU6050Inst.set_gyroscope_range = async function (range) { 
        await this.set_reg_bits(this.REG_GYRO_CONFIG, 3, 2, range); 
        this.gyroScale = this.RANGE_TO_GYRO_MULT[range];
    };
    MPU6050Inst.get_gyroscope_range = async function () { 
        let range = await this.get_reg_bits(this.REG_CONFIG, 3, 2);
        this.gyroScale = this.RANGE_TO_GYRO_MULT[range];
        return range; 
    };

    MPU6050Inst.set_accelerometer_test = async function (axis, enable) { await this.set_reg_bit(this.REG_ACCEL_CONFIG, axis, enable); };
    MPU6050Inst.get_accelerometer_test = async function (axis) { return await this.get_reg_bit(this.REG_ACCEL_CONFIG, axis); };
    MPU6050Inst.set_accelerometer_test_all = async function (enable) { 
        let val = 0;
        if (enable) val = 7; // 3 bits starting bit 5
        await this.set_reg_bits(this.REG_ACCEL_CONFIG, 5, 3, val); 
    };

    // 2 bit value
    MPU6050Inst.set_accelerometer_range = async function (range) { 
        await this.set_reg_bits(this.REG_CONFIG, 3, 2, range); 
        this.accScale = this.RANGE_TO_ACC_MULT[range];
    };
    MPU6050Inst.get_accelerometer_range = async function () { 
        let range = await this.get_reg_bits(this.REG_CONFIG, 3, 2);
        this.accScale = this.RANGE_TO_ACC_MULT[range];
        return range; 
    };
    
    MPU6050Inst.set_fifo_enable = async function (fifo, enable) { 
        this.fifo_enable = this.fifo_enable & ~(1 << fifo);                                                                  /* clear config */
        if (!enable) enable = 0; else enable = 1;
        this.fifo_enable = this.fifo_enable | (enable << fifo);                                                                 /* set config */
        await this.set_reg_bit(this.REG_FIFO_EN, fifo, enable); 
    };

    MPU6050Inst.get_fifo_enable = async function (fifo) { return await this.get_reg_bit(this.REG_FIFO_EN, fifo); };
    MPU6050Inst.set_fifo_enable_gyro = async function (enable) { 
        let val = 0;
        if (enable) val = 7; // 3 bits starting bit 4
        this.fifo_enable = this.fifo_enable & ~(7 << 4);                                                                   /* clear config */
        this.fifo_enable = this.fifo_enable | (val << 4);                                                                 /* set config */
        await this.set_reg_bits(this.REG_FIFO_EN, 4, 3, val); 
    };
    
    MPU6050Inst.set_fifo_enable_reg = async function (byte) { 
        this.fifo_enable = byte;
        await this.writeByteData(this.REG_FIFO_EN, byte);
    }
    
    MPU6050Inst.set_interrupt_level = async function (level) { await this.set_reg_bit(this.REG_INT_PIN_CFG, 7, level); };
    MPU6050Inst.get_interrupt_level = async function () { return await this.get_reg_bit(this.REG_INT_PIN_CFG, 7); };
    
    MPU6050Inst.set_interrupt_pin_type = async function (type) { await this.set_reg_bit(this.REG_INT_PIN_CFG, 6, type); };
    MPU6050Inst.get_interrupt_pin_type = async function () { return await this.get_reg_bit(this.REG_INT_PIN_CFG, 6); };
    
    MPU6050Inst.set_interrupt_latch = async function (enable) { await this.set_reg_bit(this.REG_INT_PIN_CFG, 5, enable); };
    MPU6050Inst.get_interrupt_latch = async function () { return await this.get_reg_bit(this.REG_INT_PIN_CFG, 5); };
    
    MPU6050Inst.set_interrupt_read_clear = async function (enable) { await this.set_reg_bit(this.REG_INT_PIN_CFG, 4, enable, true); };
    MPU6050Inst.get_interrupt_read_clear = async function () { return await this.get_reg_bit(this.REG_INT_PIN_CFG, 4); };
    
    MPU6050Inst.set_fsync_interrupt_level = async function (level) { await this.set_reg_bit(this.REG_INT_PIN_CFG, 3, level); };
    MPU6050Inst.get_fsync_interrupt_level = async function () { return await this.get_reg_bit(this.REG_INT_PIN_CFG, 3); };
    
    MPU6050Inst.set_fsync_interrupt = async function (enable) { await this.set_reg_bit(this.REG_INT_PIN_CFG, 2, enable); };
    MPU6050Inst.get_fsync_interrupt = async function () { return await this.get_reg_bit(this.REG_INT_PIN_CFG, 2); };
    
    MPU6050Inst.set_iic_bypass = async function (enable) { await this.set_reg_bit(this.REG_INT_PIN_CFG, 1, enable); };
    MPU6050Inst.get_iic_bypass = async function () { return await this.get_reg_bit(this.REG_INT_PIN_CFG, 1); };
    
    MPU6050Inst.set_interrupt = async function (type, enable) { await this.set_reg_bit(this.REG_INT_ENABLE, type, enable); };
    MPU6050Inst.get_interrupt = async function (type) { return await this.get_reg_bit(this.REG_INT_ENABLE, type); };
    
    MPU6050Inst.get_interrupt_status = async function () { return await this.readByteData(this.REG_INT_STATUS); };
    
    // 5 bit value
    MPU6050Inst.set_gyroscope_REG_test = async function (reg, data) { await this.set_reg_bits(reg, 0, 5, data); };
    MPU6050Inst.get_gyroscope_REG_test = async function (reg) { return await this.get_reg_bits(reg, 0, 5); };
    
    MPU6050Inst.set_gyroscope_x_test = async function (data) { await this.set_gyroscope_REG_test(this.REG_SELF_TEST_X, data); };
    MPU6050Inst.get_gyroscope_x_test = async function () { return await this.get_gyroscope_REG_test(this.REG_SELF_TEST_X); };
    MPU6050Inst.set_gyroscope_y_test = async function (data) { await this.set_gyroscope_REG_test(this.REG_SELF_TEST_Y, data); };
    MPU6050Inst.get_gyroscope_y_test = async function () { return await this.get_gyroscope_REG_test(this.REG_SELF_TEST_Y); };
    MPU6050Inst.set_gyroscope_z_test = async function (data) { await this.set_gyroscope_REG_test(this.REG_SELF_TEST_Z, data); };
    MPU6050Inst.get_gyroscope_z_test = async function () { return await this.get_gyroscope_REG_test(this.REG_SELF_TEST_Z); };

    MPU6050Inst.set_gyroscope_xyz_test = async function (arr) {
        await this.set_gyroscope_REG_test(this.REG_SELF_TEST_X, arr[0]); 
        await this.set_gyroscope_REG_test(this.REG_SELF_TEST_Y, arr[1]); 
        await this.set_gyroscope_REG_test(this.REG_SELF_TEST_Z, arr[2]); 
    };
    MPU6050Inst.get_gyroscope_xyz_test = async function () {
        let arr = [];
        arr.push(await this.get_gyroscope_REG_test(this.REG_SELF_TEST_X)); 
        arr.push(await this.get_gyroscope_REG_test(this.REG_SELF_TEST_Y)); 
        arr.push(await this.get_gyroscope_REG_test(this.REG_SELF_TEST_Z)); 
        return arr;
    };
    
    // 5 bit value, split into 3 and 2
    MPU6050Inst.set_accelerometer_REG_test = async function (reg, data) {
        let prev = await this.readByteData(reg);
        prev &= ~(7 << 5);                                                                    /* get the data */
        prev |= ((data >> 2) & 0x7) << 5;                                                     /* set the data */ 
        await this.writeByteData(reg, prev);
    
        let ashift = 4;
        switch(reg){
            default:
            case this.REG_SELF_TEST_X: ashift = 4;
            case this.REG_SELF_TEST_Y: ashift = 2;
            case this.REG_SELF_TEST_Z: ashift = 0;
        }
    
        prev = await this.readByteData(this.REG_SELF_TEST_A);
        prev &= ~(3 << ashift);                                                                    /* clear the settings */
        prev |= (data & 0x3) << ashift;                                                            /* set the data */ 
        await this.writeByteData(this.REG_SELF_TEST_A, prev); 
    };
    MPU6050Inst.get_accelerometer_REG_test = async function (reg) {
        let prev1 = await this.readByteData(reg);
        let ashift = 4;
        switch (reg) {
            default:
            case this.REG_SELF_TEST_X: ashift = 4;
            case this.REG_SELF_TEST_Y: ashift = 2;
            case this.REG_SELF_TEST_Z: ashift = 0;
        }
        let prev2 = await this.readByteData(this.REG_SELF_TEST_A);
        let data = ((prev1 & (0x7 << 5)) >> 5) << 2 | ((prev2 >> ashift) & 0x3);                      /* get the data */
        return data; 
    };
    
    MPU6050Inst.set_accelerometer_x_test = async function (data) { await this.set_accelerometer_REG_test(this.REG_SELF_TEST_X, data); };
    MPU6050Inst.get_accelerometer_x_test = async function () { return await this.get_accelerometer_REG_test(this.REG_SELF_TEST_X); };
    MPU6050Inst.set_accelerometer_y_test = async function (data) { await this.set_accelerometer_REG_test(this.REG_SELF_TEST_Y, data); };
    MPU6050Inst.get_accelerometer_y_test = async function () { return await this.get_accelerometer_REG_test(this.REG_SELF_TEST_Y); };
    MPU6050Inst.set_accelerometer_z_test = async function (data) { await this.set_accelerometer_REG_test(this.REG_SELF_TEST_Z, data); };
    MPU6050Inst.get_accelerometer_z_test = async function () { return await this.get_accelerometer_REG_test(this.REG_SELF_TEST_Z); };
    
    MPU6050Inst.set_accelerometer_xyz_test = async function (arr) {
        await this.set_accelerometer_REG_test(this.REG_SELF_TEST_X, arr[0]); 
        await this.set_accelerometer_REG_test(this.REG_SELF_TEST_Y, arr[1]); 
        await this.set_accelerometer_REG_test(this.REG_SELF_TEST_Z, arr[2]); 
    };
    MPU6050Inst.get_accelerometer_xyz_test = async function () {
        let arr = [];
        arr.push(await this.get_accelerometer_REG_test(this.REG_SELF_TEST_X)); 
        arr.push(await this.get_accelerometer_REG_test(this.REG_SELF_TEST_Y)); 
        arr.push(await this.get_accelerometer_REG_test(this.REG_SELF_TEST_Z)); 
        return arr;
    };

    MPU6050Inst.set_motion_threshold_mg = async function (threshold) { await this.writeByteData(this.REG_MOTION_THRESHOLD, Math.round(mg / 32.0)); };
    MPU6050Inst.get_motion_threshold_mg = async function () { return await this.readByteData(this.REG_MOTION_THRESHOLD) * 32; };
    
    MPU6050Inst.set_motion_duration_ms = async function (duration) { await this.writeByteData(this.REG_MOTION_DURATION, Math.round(duration)); };
    MPU6050Inst.get_motion_duration_ms = async function () { return await this.readByteData(this.REG_MOTION_DURATION); };
        
    // 3 bit value, always 111
    MPU6050Inst.set_force_accel_sample = async function (enable) { await this.wait_ms(5); await this.set_reg_bits(this.REG_ACCEL_CONFIG, 0, 3, enable?7:0); };
    
    // two arrays of three
    MPU6050Inst.self_test = async function () {
        let biases = await this.get_st_biases(0);           /* get st biases */
        let gyro_offset_raw = biases.gyro_offset;
        let accel_offset_raw = biases.accel_offset;
    
        biases = await this.get_st_biases(1);
        let gyro_offset_raw_st = biases.gyro_offset;
        let accel_offset_raw_st = biases.accel_offset;
    
    
        let err1 = await this.accel_self_test(accel_offset_raw, accel_offset_raw_st);        /* accel self test */
        let err2 = await this.gyro_self_test(gyro_offset_raw, gyro_offset_raw_st);           /* gyro self test */
    
        if (err1 || err2){
            console.log('self test err1 '+err1+' err2 '+err2);
        }
        let prev = 1 << 7;                                                                         /* reset the device */ 
        await this.writeByteData(this.REG_PWR_MGMT_1, prev);                   /* write pwr mgmt 1 */ await this.wait_ms(100);
        prev = await this.readByteData(this.REG_PWR_MGMT_1);
        prev &= ~(1 << 6);                                                                     /* clear config */ 
        await this.writeByteData(this.REG_PWR_MGMT_1, prev);                   /* write pwr mgmt 1 */
    
        return { gyro_offset_raw, accel_offset_raw }; 
    };
    
    
    // 4 bit value
    MPU6050Inst.set_iic_clock = async function (clk) { await this.set_reg_bits(this.REG_I2C_MST_CTRL, 0, 4, clk); };
    MPU6050Inst.get_iic_clock = async function () { return await this.get_reg_bits(this.REG_I2C_MST_CTRL, 0, 4); };

    MPU6050Inst.set_iic_multi_master = async function (enable) { await this.set_reg_bit(this.REG_I2C_MST_CTRL, 7, enable); };
    MPU6050Inst.get_iic_multi_master = async function () { return await this.get_reg_bit(this.REG_I2C_MST_CTRL, 7); };
    
    MPU6050Inst.set_iic_wait_for_external_sensor = async function (enable) { await this.set_reg_bit(this.REG_I2C_MST_CTRL, 6, enable); };
    MPU6050Inst.get_iic_wait_for_external_sensor = async function () { return await this.get_reg_bit(this.REG_I2C_MST_CTRL, 6); };
    
    MPU6050Inst.set_iic_read_mode = async function (mode) { await this.set_reg_bit(this.REG_I2C_MST_CTRL, 4, mode); };
    MPU6050Inst.get_iic_read_mode = async function () { return await this.get_reg_bit(this.REG_I2C_MST_CTRL, 4); };
    
    MPU6050Inst.set_iic_fifo_enable = async function (slave, enable) {
        if ((slave == this.IIC_SLAVE_0) ||
            (slave == this.IIC_SLAVE_1) ||
            (slave == this.IIC_SLAVE_2)
        ) {
            await this.set_reg_bit(this.REG_FIFO_EN, slave, enable);
            this.fifo_enable = this.fifo_enable & ~(1 << slave);                                                                  /* clear config */
            if (!enable) enable = 0; else enable = 1;
            this.fifo_enable = this.fifo_enable | (enable << slave);                                                                 /* set config */
        } else {
            if (slave == this.IIC_SLAVE_3) {
                await this.set_reg_bit(this.REG_I2C_MST_CTRL, 5, enable);
                this.fifo_enable = this.fifo_enable & ~(1 << this.FIFO_SLV3);
                if (!enable) enable = 0; else enable = 1;
                this.fifo_enable = this.fifo_enable | (enable << this.FIFO_SLV3);
            }
        }
    };

    MPU6050Inst.get_iic_fifo_enable = async function (slave) {
        if ((slave == this.IIC_SLAVE_0) ||
            (slave == this.IIC_SLAVE_1) ||
            (slave == this.IIC_SLAVE_2)
        ) {
            return await this.get_reg_bit(this.REG_FIFO_EN, slave);
        } else {
            if (slave == this.IIC_SLAVE_3) {
                return await this.get_reg_bit(this.REG_I2C_MST_CTRL, 5);
            }
        }
        return 0; 
    };
    
    MPU6050Inst.set_iic_mode = async function (slave, mode) {  await this.set_reg_bit(this.I2C_SLAVE_TO_ADDR[slave], 7, mode); };
    MPU6050Inst.get_iic_mode = async function (slave) { return await this.get_reg_bit(this.I2C_SLAVE_TO_ADDR[slave], 7); };
    
    MPU6050Inst.set_iic_address = async function (slave, addr_7bit) { await this.set_reg_bits(this.I2C_SLAVE_TO_ADDR[slave], 0, 7, addr_7bit); };
    MPU6050Inst.get_iic_address = async function (slave) { return await this.get_reg_bits(this.I2C_SLAVE_TO_ADDR[slave], 0, 7); };
    
    MPU6050Inst.set_iic_register = async function (slave, regin) { await this.writeByteData(this.I2C_SLAVE_TO_REG[slave], regin); };
    MPU6050Inst.get_iic_register = async function (slave) { return await this.readByteData(this.I2C_SLAVE_TO_REG[slave]); };
    
    MPU6050Inst.set_iic_data_out = async function (slave, data) { await this.writeByteData(this.I2C_SLAVE_TO_DO[slave], data); };
    MPU6050Inst.get_iic_data_out = async function (slave) { return await this.readByteData(this.I2C_SLAVE_TO_DO[slave]); };
    
    MPU6050Inst.set_iic_ctrl_bit = async function (slave, bit, enable) { await this.set_reg_bit(this.I2C_SLAVE_TO_CTRL[slave], bit, enable); };
    MPU6050Inst.get_iic_ctrl_bit = async function (slave, bit) { return await this.get_reg_bit(this.I2C_SLAVE_TO_CTRL[slave], bit); };
    
    MPU6050Inst.set_iic_enable = async function (slave, enable) { await this.set_iic_ctrl_bit(slave, 7, enable); };
    MPU6050Inst.get_iic_enable = async function (slave) { return await this.get_iic_ctrl_bit(slave, 7); };
    
    MPU6050Inst.set_iic_byte_swap = async function (slave, enable) { await this.set_iic_ctrl_bit(slave, 6, enable); };
    MPU6050Inst.get_iic_byte_swap = async function (slave) { return await this.get_iic_ctrl_bit(slave, 6); };
    
    MPU6050Inst.set_iic_transaction_mode = async function (slave, mode) { await this.set_iic_ctrl_bit(slave, 5, mode); };
    MPU6050Inst.get_iic_transaction_mode = async function (slave) { return await this.get_iic_ctrl_bit(slave, 5); };
    
    MPU6050Inst.set_iic_group_order = async function (slave, order) { await this.set_iic_ctrl_bit(slave, 4, order); };
    MPU6050Inst.get_iic_group_order = async function (slave) { return await this.get_iic_ctrl_bit(slave, 4); };
    

    MPU6050Inst.i2cLen = [0, 0, 0, 0, 0];
    MPU6050Inst.set_iic_transferred_len = async function (slave, len) { 
        this.i2cLen[slave] = len;
        await this.set_reg_bits(this.I2C_SLAVE_TO_CTRL[slave], 0, 4, len); 
    };
    MPU6050Inst.get_iic_transferred_len = async function (slave) { return await this.get_reg_bits(this.I2C_SLAVE_TO_CTRL[slave], 0, 4); };

    
    MPU6050Inst.get_iic_status = async function () { return await this.readByteData(this.REG_I2C_MST_STATUS); };
    
    MPU6050Inst.set_iic_delay_enable = async function (delay, enable) { await this.set_reg_bit(this.REG_I2C_MST_DELAY_CTRL, delay, enable); };
    MPU6050Inst.get_iic_delay_enable = async function (delay) { return await this.get_reg_bit(this.REG_I2C_MST_DELAY_CTRL, delay); };
    
    MPU6050Inst.set_iic4_enable = async function (enable) { await this.set_reg_bit(this.REG_I2C_SLV4_CTRL, 7, enable); };
    MPU6050Inst.get_iic4_enable = async function () { return await this.get_reg_bit(this.REG_I2C_SLV4_CTRL, 7); };
    
    MPU6050Inst.set_iic4_interrupt = async function (enable) { await this.set_reg_bit(this.REG_I2C_SLV4_CTRL, 6, enable); };
    MPU6050Inst.get_iic4_interrupt = async function () { return await this.get_reg_bit(this.REG_I2C_SLV4_CTRL, 6); };
    
    MPU6050Inst.set_iic4_transaction_mode = async function (mode) { await this.set_reg_bit(this.REG_I2C_SLV4_CTRL, 5, mode); };
    MPU6050Inst.get_iic4_transaction_mode = async function () { return await this.get_reg_bit(this.REG_I2C_SLV4_CTRL, 5); };
    
    // note: for iic4?
    MPU6050Inst.set_iic_delay = async function (delay) { await this.set_reg_bits(this.REG_I2C_SLV4_CTRL, 0, 5, delay); };
    MPU6050Inst.get_iic_delay = async function () { return await this.get_reg_bits(this.REG_I2C_SLV4_CTRL, 0, 5); };
    
    MPU6050Inst.set_iic4_data_out = async function (data) { await this.writeByteData(this.REG_I2C_SLV4_DO, data); };
    MPU6050Inst.get_iic4_data_out = async function () { return  await this.readByteData(this.REG_I2C_SLV4_DO); };
    
    MPU6050Inst.set_iic4_data_in = async function (data) { await this.writeByteData(this.REG_I2C_SLV4_DI, data); };
    MPU6050Inst.get_iic4_data_in = async function () { return await this.readByteData(this.REG_I2C_SLV4_DI); };
    
    MPU6050Inst.read_extern_sensor_data = async function (len) { return await this.readI2cBlockData(this.REG_EXT_SENS_DATA_00, len); };
    
    MPU6050Inst.set_reg = async function (reg, data) { await this.writeI2cBlockData(reg, data); };
    MPU6050Inst.get_reg = async function (reg, len) { return await this.readI2cBlockData(reg, len); };

}

module.exports = addBase;
