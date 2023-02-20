

function addDmp(MPU6050Inst) {


    // note:
    // if we call functions to write DMP memory BEFORE loading the firmware,
    // then we shadow the memory, and modify that. 
    MPU6050Inst.dmp_shadow_active = false;

    // some basic defaults.... to save a lot of typing if you don't need to change much
    MPU6050Inst.dmp_defaults = async function () {
        await this.set_sleep(false);
        await this.set_clock_source(this.CLOCK_SOURCE_PLL_X_GYRO);
        await this.set_sample_rate(50);
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
    };

    MPU6050Inst.dmp_loaded_defaults = async function () {
        
        let orientation = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];

        await this.dmp_set_tap_axes(this.AXIS_X, 1);
        await this.dmp_set_tap_axes(this.AXIS_Y, 1);
        await this.dmp_set_tap_axes(this.AXIS_Z, 1);
        await this.dmp_set_fifo_rate(25);
        await this.dmp_set_interrupt_mode(this.DMP_INTERRUPT_MODE_CONTINUOUS);
        await this.dmp_set_orientation(orientation);

        await this.dmp_set_feature(
            this.DMP_FEATURE_6X_QUAT |
            this.DMP_FEATURE_TAP |
            this.DMP_FEATURE_PEDOMETER |
            this.DMP_FEATURE_ORIENT |
            this.DMP_FEATURE_SEND_RAW_ACCEL |
            this.DMP_FEATURE_SEND_RAW_GYRO |
            this.DMP_FEATURE_SEND_CAL_GYRO |
            this.DMP_FEATURE_GYRO_CAL |
            0
        );

        await this.dmp_set_pedometer_walk_time(200);
        await this.dmp_set_pedometer_step_count(0);
        await this.dmp_set_shake_reject_timeout_ms(10);
        await this.dmp_set_shake_reject_time_ms(40);
        await this.dmp_set_shake_reject_thresh_dps(200);
        await this.dmp_set_tap_time_multi_ms(200);
        await this.dmp_set_tap_time_ms(100);
        await this.dmp_set_min_tap_count(1);
        await this.dmp_set_tap_thresh(this.AXIS_X, 250);
        await this.dmp_set_tap_thresh(this.AXIS_Y, 250);
        await this.dmp_set_tap_thresh(this.AXIS_Z, 250);

    };


    MPU6050Inst.dmp_make_shadow = function(){
        MPU6050Inst.dmp_code = MPU6050Inst.dmp_code_org.slice();
        MPU6050Inst.dmp_shadow_active = true;
    }

    // read any amount of dmp memory, across any boundary.
    MPU6050Inst.dmp_read_mem = async function(addr, len) {
        if (!this.dmp_inited){
            if (!this.dmp_shadow_active){
                this.dmp_make_shadow();
            }
    
            let b = [];
            for (let i = 0; i < len; i++){
                b.push(this.dmp_code[addr + i]);
            }
            return b;
        }

        let chunksize = 32;
        let offs = 0;
        let buf = [];
        while (offs < len){
            let l = chunksize;
            if (offs + l > len) l = len - offs; // last block len
            // if block crosses a page boundary, read a short block
            if (((addr+offs) & 0xff00) !== ((addr+offs+l-1) & 0xff00)){
                l = ((addr+offs+l) & 0xff00) - (addr+offs);
            }
            await this.writeWordDataBE(this.REG_BANK_SEL, addr+offs);
            buf.push(... (await this.readI2cBlockData(this.REG_MEM, l)));
            offs += l;
        }
        return buf;
    };

    // verify dmp mem content against a buffer (e.g. what you wrote).
    MPU6050Inst.dmp_verify_mem = async function(addr, buf) {
        let chunksize = 32;
        let offs = 0;
        let len = buf.length;
        while (offs < len){
            let l = chunksize;
            if (offs + l > len) l = len - offs; // last block len
            // if block crosses a page boundary, read a short block
            if (((addr+offs) & 0xff00) !== ((addr+offs+l) & 0xff00)){
                l = ((addr+offs+l) & 0xff00) - (addr+offs);
            }
            await this.writeWordDataBE(this.REG_BANK_SEL, addr+offs);
            let b = await this.readI2cBlockData(this.REG_MEM, l);
            if (b.length !== l){
                let msg = 'dmp mem verify len mismatch';
                console.error(msg);
                throw(msg);
            }
            for (let i = 0; i < b.length; i++){
                if (b[i] !== buf[offs+i]){
                    let msg = 'dmp mem verify data mismatch at 0x'+(addr+offs).toString(16);
                    console.error(msg);
                    throw(msg);
                }
            }
            offs += l;
        }
        return buf;
    };

    // write any amount of dmp memory, across any boundary.
    MPU6050Inst.dmp_write_mem = async function(addr, buf) {
        if (!this.dmp_inited){
            if (!this.dmp_shadow_active){
                this.dmp_make_shadow();
            }
            let len = buf.length;
            for (let i = 0; i < len; i++){
                this.dmp_code[addr + i] = buf[i];
            }
            return;
        }

        let chunksize = 32;
        let offs = 0;
        let len = buf.length;
        while (offs < len){
            let l = chunksize;
            if (offs + l > len) l = len - offs; // last block len
            // if block crosses a page boundary, send a short block
            if (((addr+offs) & 0xff00) !== ((addr+offs+l) & 0xff00)){
                l = ((addr+offs+l) & 0xff00) - (addr+offs);
            }
            await this.writeWordDataBE(this.REG_BANK_SEL, addr+offs);
            await this.writeI2cBlockData(this.REG_MEM, buf.slice(offs, offs+l));
            offs += l;
        }
    };

    MPU6050Inst.dmp_dumpmem = async function (txt, addr, len, width) {
        let mem = await this.dmp_read_mem(addr, len);
        len = mem.length;
        width = width || 32;
        let offs = (addr % width);
        for (let i = addr - offs; i < addr+len; i += width) {
            txt += '\n' + ('000' + i.toString(16)).slice(-4) + ': ';
            for (let j = i; j < i + width && j < addr+len; j++) {
                if (j < offs){
                    txt += ('   ');
                } else {
                    txt += ('0' + mem[j-addr].toString(16)).slice(-2) + ' ';
                }
            }
        }
        txt += '\n';
        return txt;
    };

    MPU6050Inst.dmp_load_firmware = async function(firmware) {
        firmware = firmware || this.dmp_code;
        console.log('writing firmware bytes '+firmware.length);
        this.dmp_inited = 2; // force real writing
        await this.dmp_write_mem(0, firmware);
        await this.dmp_verify_mem(0, firmware);
        await this.writeWordDataBE(this.REG_PROGRAM_START, this.dmp_start_addr); // 0x400 is start address?
        console.log('set firmware start addr 0x'+this.dmp_start_addr.toString(16));
        this.dmp_inited = 1;                                                              /* flag the dmp inited bit */
        // dump the modified memory now we have used it (if we used it).
        this.dmp_code = this.dmp_code_org;
        // tell all future write to write via i2c
        this.dmp_shadow_active = false;
        return 0;                                                                            /* success return 0 */
    };

    MPU6050Inst.dmp_decode_gesture = function(gesture)
    {
        let tap;
        let orient;
        let direction, count;

        orient = gesture[3] & 0xC0;                                /* set the orient */
        tap = 0x3F & gesture[3];                                   /* set the tap */
        if ((gesture[1] & this.DMP_INT_SRC_TAP) != 0)           /* check the tap output */ {
            direction = tap >> 3;                                  /* get the direction */
            count = (tap % 8) + 1;                                 /* get the count */
            if (this.dmp_tap_callback)                  /* check the dmp tap callback */ {
                this.dmp_tap_callback(direction, count);        /* run the dmp tap callback */
            }
        }
        if ((gesture[1] & this.DMP_INT_SRC_ORIENT) != 0)        /* check the orient output */ {
            if (this.dmp_orient_callback)               /* check the dmp orient callback */ {
                this.dmp_orient_callback(orient >> 6);          /* run the dmp orient callback */
            }
        }
        return { orient, tap, direction, count };
    };

    MPU6050Inst.dmp_set_long = async function (addr, long) { await this.dmp_write_mem(addr, this.int32BEToArr(long)); };
    MPU6050Inst.dmp_get_long = async function (addr) { return this.readInt32BE(await this.dmp_read_mem(addr, 4)); };
    MPU6050Inst.dmp_get_ulong = async function (addr) { return this.readUInt32BE(await this.dmp_read_mem(addr, 4)); };
    
    MPU6050Inst.dmp_set_short = async function (addr, short) { await this.dmp_write_mem(addr, this.int16BEToArr(short)); };
    MPU6050Inst.dmp_get_short = async function (addr) { return this.readInt16BE(await this.dmp_read_mem(addr, 2)); };
    MPU6050Inst.dmp_get_ushort = async function (addr) { return this.readUInt16BE(await this.dmp_read_mem(addr, 2)); };
    
    MPU6050Inst.dmp_set_byte = async function (addr, byte) { await this.dmp_write_mem(addr, [(byte & 0xFF)]); };
    MPU6050Inst.dmp_get_byte = async function (addr) { return (await this.dmp_read_mem(addr, 1))[0]; };
    
    MPU6050Inst.dmp_set_pedometer_walk_time = async function(ms) { await this.dmp_set_long(this.DMP_D_PEDSTD_TIMECTR, (ms/20)>>0); };
    MPU6050Inst.dmp_get_pedometer_walk_time = async function() { return 20*(await this.dmp_get_ulong(this.DMP_D_PEDSTD_TIMECTR)); };
    
    MPU6050Inst.dmp_set_pedometer_step_count = async function (count) { await this.dmp_set_long(this.DMP_D_PEDSTD_STEPCTR, count); };
    MPU6050Inst.dmp_get_pedometer_step_count = async function() { return await this.dmp_get_ulong(this.DMP_D_PEDSTD_STEPCTR); };
    
    MPU6050Inst.dmp_set_shake_reject_timeout_ms = async function (ms) { await this.dmp_set_short(this.DMP_D_1_88, Math.round(ms/(1000 / this.sample_rate))); };
    MPU6050Inst.dmp_get_shake_reject_timeout_ms = async function () { return (await this.dmp_get_ushort(this.DMP_D_1_88)) * (1000 / this.sample_rate); };
    
    MPU6050Inst.dmp_set_shake_reject_time_ms = async function (ms) { return await this.dmp_set_short(this.DMP_D_1_90, Math.round(ms/(1000 / this.sample_rate))); };
    MPU6050Inst.dmp_get_shake_reject_time_ms = async function () { return (await this.dmp_get_short(this.DMP_D_1_90)) * (1000 / this.sample_rate); };
    
    MPU6050Inst.dmp_set_shake_reject_thresh_dps = async function (dps) { return await this.dmp_set_long(this.DMP_D_1_92, Math.round(this.DMP_GYRO_SF / 1000 * dps)); };
    MPU6050Inst.dmp_get_shake_reject_thresh_dps = async function () { return (await this.dmp_get_long(this.DMP_D_1_92)) / ((this.DMP_GYRO_SF) / 1000.0); };
    
    MPU6050Inst.dmp_set_tap_time_multi_ms = async function (ms) { await this.dmp_set_short(this.DMP_D_1_218, Math.round(ms/(1000 / this.sample_rate))); };
    MPU6050Inst.dmp_get_tap_time_multi_ms = async function () { return (await this.dmp_get_short(this.MPU6050_DMP_D_1_218))*(1000 / this.sample_rate); };
    
    MPU6050Inst.dmp_set_tap_time_ms = async function (ms) { await this.dmp_set_short(this.DMP_TAPW_MIN, Math.round( ms / (1000 / this.sample_rate))); };
    MPU6050Inst.dmp_get_tap_time_ms = async function () { return (1000 / this.sample_rate)*(await this.dmp_get_short(this.DMP_TAPW_MIN)); }
    
    MPU6050Inst.dmp_set_min_tap_count = async function(count){ await this.dmp_set_byte(this.DMP_D_1_79, count); };
    MPU6050Inst.dmp_get_min_tap_count = async function () { return (await this.dmp_get_byte(this.DMP_D_1_79)); };
    
    MPU6050Inst.dmp_set_gyro_calibrate = async function(enable){
        let regs = [0xb8, 0xaa, 0xaa, 0xaa, 0xb0, 0x88, 0xc3, 0xc5, 0xc7];
        if (enable){
            regs = [ 0xb8, 0xaa, 0xb3, 0x8d, 0xb4, 0x98, 0x0d, 0x35, 0x5d];
        }
        await this.dmp_write_mem(this.DMP_CFG_MOTION_BIAS, regs);        /* write data */
        this.mask &= ~this.DMP_FEATURE_GYRO_CAL;             
        if (enable) {
            this.mask |= this.DMP_FEATURE_GYRO_CAL;             
        }
    }
    
    MPU6050Inst.dmp_set_3x_quaternion = async function (enable, noreset) {
        let regs = [0x8B, 0x8B, 0x8B, 0x8B];
        if (enable) {
            regs = [0xC0, 0xC2, 0xC4, 0xC6];
        }
        await this.dmp_write_mem(this.DMP_CFG_LP_QUAT, regs);
        if (!noreset) {
            if (this.dmp_inited) await this.reset_fifo();                                              /* reset the fifo */
        }
        this.mask &= ~this.DMP_FEATURE_3X_QUAT;
        if (enable) {
            this.mask |= this.DMP_FEATURE_3X_QUAT;
        }
    }
    
    MPU6050Inst.dmp_set_6x_quaternion = async function (enable, noreset) {
        let regs = [0xA3, 0xA3, 0xA3, 0xA3];
        if (enable) {
            regs = [0x20, 0x28, 0x30, 0x38];
        }
        await this.dmp_write_mem(this.DMP_CFG_8, regs, 4);
        if (!noreset) {
            if (this.dmp_inited) await this.reset_fifo();                                              /* reset the fifo */
        }
        this.mask &= ~this.DMP_FEATURE_6X_QUAT;
        if (enable) {
            this.mask |= this.DMP_FEATURE_6X_QUAT;
        }
    }
    
    MPU6050Inst.dmp_set_interrupt_mode = async function (mode) {
        let regs = [0xda, 0xb1, 0xb9,
            0xf3, 0x8b, 0xa3,
            0x91, 0xb6, 0xda,
            0xb4, 0xda];
        if (mode == this.DMP_INTERRUPT_MODE_CONTINUOUS) {
            regs = [0xd8, 0xb1, 0xb9,
                0xf3, 0x8b, 0xa3,
                0x91, 0xb6, 0x09,
                0xb4, 0xd9];
        } 
        await this.dmp_write_mem(this.DMP_CFG_FIFO_ON_EVENT, regs);
    }
    
    MPU6050Inst.dmp_set_gyro_bias = async function (bias) {
        let gyro_bias_body = [0,0,0];
        let orient = this.orient || 0;
        gyro_bias_body[0] = bias[orient & 3];                                                   /* set the body 0 */
        if ((orient & 4) != 0)                                                                  /* check bit 3 */ {
            gyro_bias_body[0] *= -1;                                                                    /* *(-1) */
        }
        gyro_bias_body[1] = bias[(orient >> 3) & 3];                                            /* set the body 1 */
        if ((orient & 0x20) != 0)                                                               /* check bit 6 */ {
            gyro_bias_body[1] *= -1;                                                                    /* *(-1) */
        }
        gyro_bias_body[2] = bias[(orient >> 6) & 3];                                            /* set the body 2 */
        if ((orient & 0x100) != 0)                                                              /* check bit 9 */ {
            gyro_bias_body[2] *= -1;                                                                    /* *(-1) */
        }
        
        let mult = this.DMP_GYRO_SF / 0x4000;
        for (let i = 0; i < 3; i++){
            let float = gyro_bias_body[i];
            let raw = float * mult;
            await this.dmp_set_long(this.DMP_D_EXT_GYRO_BIAS_X + 4*i, raw);
        }
    }
    
    MPU6050Inst.dmp_get_gyro_bias = async function () {
        let mult = this.DMP_GYRO_SF / 0x4000;
        let gyroRaw = [];
        let gyroFloat = [];
        for (let i = 0; i < 3; i++) {
            let raw = await this.dmp_get_long(this.DMP_D_EXT_GYRO_BIAS_X + 4 * i);
            let float = raw / mult;
            gyroRaw.push(raw);
            gyroFloat.push(float);
        }   
        return { gyroRaw, gyroFloat };                                                                                       /* success return 0 */
    }
    
    MPU6050Inst.dmp_set_accel_bias = async function (bias) {
        let accscale = this.accScale;
        let accel_sf = this.accScale << 15;

        let accel_bias_body = [0, 0, 0];
        let orient = this.orient || 0;
        accel_bias_body[0] = bias[orient & 3];                                                   /* set the body 0 */
        if ((orient & 4) != 0)                                                                  /* check bit 3 */ {
            accel_bias_body[0] *= -1;                                                                    /* *(-1) */
        }
        accel_bias_body[1] = bias[(orient >> 3) & 3];                                            /* set the body 1 */
        if ((orient & 0x20) != 0)                                                               /* check bit 6 */ {
            accel_bias_body[1] *= -1;                                                                    /* *(-1) */
        }
        accel_bias_body[2] = bias[(orient >> 6) & 3];                                            /* set the body 2 */
        if ((orient & 0x100) != 0)                                                              /* check bit 9 */ {
            accel_bias_body[2] *= -1;                                                                    /* *(-1) */
        }
    
        let accOffsetRaw = [];
        let accOffsetRawFloat = [];
        let accOffsetG = accel_bias_body;
        for (let i = 0; i < 3; i++) {
            let offsg = accOffsetG[i];
            let offsf = offsg * accscale;
            let offs32 = offsf * (1 << 15);
            accOffsetRawFloat.push(offsf);
            accOffsetRaw.push(offs32);
            await this.dmp_set_long(this.DMP_D_ACCEL_BIAS + i*4, accOffsetRaw[i]);
        }
    };
    
    MPU6050Inst.dmp_get_accel_bias = async function () {
        let accscale = this.accScale;
        let accel_sf = this.accScale << 15;

        let accOffsetRaw = [];
        let accOffsetRawFloat = [];
        let accOffsetG = [];
        for (let i = 0; i < 3; i++){
            let offs32 = await this.dmp_get_long(this.DMP_D_ACCEL_BIAS + i*4)
            accOffsetRaw.push(offs32);
            let offsf = offs32 / (1 << 15);
            accOffsetRawFloat.push(offsf);
            let offsg = offsf / accscale;
            accOffsetG.push(offsg);
        }
        return { range, accscale, accOffsetRaw, accOffsetRawFloat, accOffsetG };
    };

    MPU6050Inst.inv_row_2_scale = function(row) {
        let b = 0;
    
        if (row[0] > 0)             /* check row 0 */ {
            b = 0;                  /* set 0 */
        }
        else if (row[0] < 0)        /* check row 0 */ {
            b = 4;                  /* set 4 */
        }
        else if (row[1] > 0)        /* check row 1 */ {
            b = 1;                  /* set 1 */
        }
        else if (row[1] < 0)        /* check row 1 */ {
            b = 5;                  /* set 5 */
        }
        else if (row[2] > 0)        /* check row 2 */ {
            b = 2;                  /* set 2 */
        }
        else if (row[2] < 0)        /* check row 2 */ {
            b = 6;                  /* set 6 */
        }
        else {
            b = 7;                  /* set 7 */
        }
    
        return b;                   /* return scale */
    };
    
    MPU6050Inst.inv_orientation_matrix_to_scalar = function(mtx) {
        let scalar;
        scalar = this.inv_row_2_scale(mtx);                  /* convert the part 0 */
        scalar |= this.inv_row_2_scale(mtx.slice(3)) << 3;        /* convert the part 1 */
        scalar |= this.inv_row_2_scale(mtx.slice(6)) << 6;        /* convert the part 2 */
        return scalar;                                            /* return the scalar */
    };
    

    MPU6050Inst.dmp_set_orientation = async function (mat) {
        let gyro_axes = [ 0x4C, 0xCD, 0x6C]; // these get re-ordered
        let accel_axes = [ 0x0C, 0xC9, 0x2C ];
        let gyro_sign = [ 0x36, 0x56, 0x76 ]; // these get bit 0 changed
        let accel_sign = [ 0x26, 0x46, 0x66 ];
        
        let gyro_regs = [];
        let accel_regs = [];
        let orient = 0;
    
        orient = this.inv_orientation_matrix_to_scalar(mat);             /* inv orientation matrix to scalar */
        console.log('orient ' + orient.toString(2) + ' from mat '+mat.toString());
    
        for (let i = 0; i < 3; i ++){
            let val = (orient >> (3*i)) & 3;
            gyro_regs.push(gyro_axes[val]);                                 /* set the gyro regs 0 */
            accel_regs.push(accel_axes[val]);                        /* set the accel regs 1 */

            val = (orient >> (3*i)) & 4; // sign
            if (val) {
                accel_sign[i] |= 1;
                gyro_sign[i] |= 1;
            }
        }

        await this.dmp_write_mem(this.DMP_FCFG_1, gyro_regs, 3);                   /* write data */
        await this.dmp_write_mem(this.DMP_FCFG_2, accel_regs, 3);                  /* write data */
        await this.dmp_write_mem(this.DMP_FCFG_3, gyro_sign, 3);                   /* write data */
        await this.dmp_write_mem(this.DMP_FCFG_7, accel_sign, 3);                  /* write data */

        this.orient = orient;                                              /* set the orient */
        return 0;                                                             /* success return 0 */
    };
    
    MPU6050Inst.dmp_set_feature = async function (mask) {
        await this.dmp_set_long(this.DMP_D_0_104, this.DMP_GYRO_SF);
        let tmp = [
            0xA3, // unknown
            0xA3, 0xA3, 0xA3, // acc
            0xA3, 0xA3, 0xA3, // gyro
            0xA3, 0xA3, 0xA3 // unknown
        ];
        if (mask & this.DMP_FEATURE_SEND_RAW_ACCEL)                                /* set the raw accel */ {
            tmp[1] = 0xC0;                                                                   /* set the param 1 */
            tmp[2] = 0xC8;                                                                   /* set the param 2 */
            tmp[3] = 0xC2;                                                                   /* set the param 3 */
        }
        if (mask & this.DMP_FEATURE_SEND_ANY_GYRO)                                 /* set the any gyro */ {
            tmp[4] = 0xC4;                                                                   /* set the param 4 */
            tmp[5] = 0xCC;                                                                   /* set the param 5 */
            tmp[6] = 0xC6;                                                                   /* set the param 6 */
        }
        await this.dmp_write_mem(this.DMP_CFG_15, tmp);                      /* write data */
    
        if (mask & (this.DMP_FEATURE_TAP | this.DMP_FEATURE_ORIENT))            /* set the cfg */ {
            await this.dmp_write_mem(this.DMP_CFG_27, [0x20]);                       /* write data */
        } else {
            await this.dmp_write_mem(this.DMP_CFG_27, [0xD8]);                       /* write data */
        }
    
        await MPU6050Inst.dmp_set_gyro_calibrate(mask & this.DMP_FEATURE_GYRO_CAL);
    
        if (mask & this.DMP_FEATURE_SEND_ANY_GYRO)                                 /* check the gyro */ {
            let regs = [0xC0, 0x80, 0xC2, 0x90];
            if (mask & this.DMP_FEATURE_SEND_CAL_GYRO)                             /* set the cal gyro */ {
                regs = [0xB2, 0x8B, 0xB6, 0x9B];
            }
            await this.dmp_write_mem(this.DMP_CFG_GYRO_RAW_DATA, regs);         /* write data */
        }
    
        if (mask & this.DMP_FEATURE_TAP)                                           /* check the tap */ {
            await this.dmp_write_mem(this.DMP_CFG_20, [0xf8]);                   /* write data */
            await this.dmp_set_tap_thresh(this.AXIS_ALL, this.DMP_TAP_THRESH)
            await this.dmp_write_mem(this.DMP_D_1_72, [0x3f]);                   /* enable all tap axis */
            await this.dmp_set_min_tap_count(this.DMP_TAP_MIN_TAP_COUNT-1);
            await this.dmp_set_tap_time_ms(this.DMP_TAP_TIME);
            await this.dmp_set_tap_time_multi_ms(this.DMP_TAP_TIME_MULTI);
            await this.dmp_set_shake_reject_thresh_dps(this.DMP_SHAKE_REJECT_THRESH);
            await this.dmp_set_shake_reject_time_ms(this.DMP_SHAKE_REJECT_TIME);
            await this.dmp_set_shake_reject_timeout_ms(this.DMP_SHAKE_REJECT_TIMEOUT);
        } else {
            await this.dmp_write_mem(this.DMP_CFG_20, [0xD8]);                   
        }
    
        if (mask & this.DMP_FEATURE_ORIENT)                                        /* set the orient */ {
            await this.dmp_write_mem(this.DMP_CFG_ORIENT_INT, [0xD9]);                   
        } else {
            await this.dmp_write_mem(this.DMP_CFG_ORIENT_INT, [0xD8]);                   
        }
    
        await this.dmp_set_3x_quaternion(mask & this.DMP_FEATURE_3X_QUAT, true);
        await this.dmp_set_6x_quaternion(mask & this.DMP_FEATURE_6X_QUAT, true);
        this.mask = mask | this.DMP_FEATURE_PEDOMETER;                                 /* set the mask */

        if (this.dmp_inited) await this.reset_fifo();                                              /* reset the fifo */
        return;                                                 /* reset the fifo */
    }
    
    MPU6050Inst.dmp_set_fifo_rate = async function (rate) {
        let regs_end = [
            0xFE, 0xF2, 0xAB,
            0xC4, 0xAA, 0xF1,
            0xDF, 0xDF, 0xBB,
            0xAF, 0xDF, 0xDF];
        // limit rate
        if (rate > this.sample_rate)                                        /* check rate */ {
            rate = this.sample_rate;                                                              /* return error */
        }
        this.dmp_rate_div = Math.round((this.sample_rate / rate) - 1);
        await this.dmp_set_short(this.DMP_D_0_22, this.dmp_rate_div);
        await this.dmp_write_mem(this.DMP_CFG_6, regs_end);

        let newrate = this.sample_rate/(1+this.dmp_rate_div);
        return newrate;
    };
    
    
    MPU6050Inst.dmp_get_fifo_rate = async function () {
        this.dmp_rate_div = await this.dmp_get_short(this.DMP_D_0_22);
        return this.sample_rate / (this.dmp_rate_div + 1);
    };
    
    MPU6050Inst.dmp_set_tap_axes = async function (axis, enable) {
        let tmp = await this.dmp_get_byte(this.DMP_D_1_72);
        let pos = ((axis - 5) * 2);                                           /* get the pos */
        if (enable)                                           /* if enable */ {
            tmp |= (3 << pos);                                                     /* enable */
        }
        else {
            tmp &= ~(3 << pos);                                                    /* disable */
        }
        await this.dmp_set_byte(this.DMP_D_1_72, tmp);
        return 0;                                                                  /* success return 0 */
    }
    
    MPU6050Inst.dmp_get_tap_axes = async function () {
        let axis = await this.dmp_get_byte(this.DMP_D_1_72);
        let pos = ((axis - 5) * 2);                                           /* get the pos */
        let enable = false;
        if (((axis >> pos) & 0x3) == 0x3)                                           /* if enable */ {
            enable = true;                                           /* set enable */
        }
        return { axis, enable };                                                                  /* success return 0 */
    }
    
    MPU6050Inst.dmp_set_tap_thresh = async function (axis, mg_ms) {
        if (mg_ms > 1600)                                                          /* check the mg/ms */ {
            mg_ms = 1600;
        }
    
        let scaled_thresh = mg_ms / this.sample_rate;                    /* get the scaled thresh */
        let dmp_thresh = scaled_thresh * this.accScale;
        let dmp_thresh_2 = (dmp_thresh*3/4);
        if (axis === this.AXIS_X || (axis === this.AXIS_ALL))                                                 /* if axis x */ {
            await this.dmp_set_short(this.DMP_TAP_THX, dmp_thresh);
            await this.dmp_set_short(this.DMP_D_1_36, dmp_thresh_2);
        }
        if (axis === this.AXIS_Y || (axis === this.AXIS_ALL))                                           /* if axis y */ {
            await this.dmp_set_short(this.DMP_TAP_THY, dmp_thresh);
            await this.dmp_set_short(this.DMP_D_1_40, dmp_thresh_2);
        }
        if (axis === this.AXIS_Z || (axis === this.AXIS_ALL))                                           /* if axis z */ {
            await this.dmp_set_short(this.DMP_TAP_THZ, dmp_thresh);
            await this.dmp_set_short(this.DMP_D_1_44, dmp_thresh_2);
        }
    }
    
    // returns an array of onw or all axis
    MPU6050Inst.dmp_get_tap_thresh = async function (axis) {
        let ress = [];
        if (axis == this.AXIS_X || (axis === this.AXIS_ALL))                                                /* if axis x */ {
            res = await this.dmp_get_short(this.DMP_TAP_THX);
            let scaled_thresh = res/this.accScale;
            let mg_ms = (scaled_thresh * this.sample_rate);              /* set the mg/ms */
            ress.push(mg_ms)
        }
        if (axis == this.AXIS_Y || (axis === this.AXIS_ALL))                                           /* if axis y */ {
            res = await this.dmp_get_short(this.DMP_TAP_THY);
            let scaled_thresh = res/this.accScale;
            let mg_ms = (scaled_thresh * this.sample_rate);              /* set the mg/ms */
            ress.push(mg_ms)
        }
        if (axis == this.AXIS_Z || (axis === this.AXIS_ALL))                                           /* if axis z */ {
            res = await this.dmp_get_short(this.DMP_TAP_THZ);
            let scaled_thresh = res/this.accScale;
            let mg_ms = (scaled_thresh * this.sample_rate);              /* set the mg/ms */
            ress.push(mg_ms)
        }
        return ress;                                                                  /* success return 0 */
    }
    
    MPU6050Inst.dmp_read = async function () {
        let outs = {
            overflow: false, 
            packets: []
        };

        if (await this.get_reg_bit(this.REG_INT_STATUS, this.INTERRUPT_FIFO_OVERFLOW))                                                             /* if fifo overflow */ {
            console.log("mpu6050: fifo overflow.");                                                                 /* fifo overflow */
            await this.reset_fifo();                                                                               /* reset the fifo */
            outs.overflow = true;
            return outs;
        }
    
        let len = 0;                                                                                                              /* set len 0 */
        if (this.mask & this.DMP_FEATURE_SEND_RAW_ACCEL)                                                         /* check the accel */ {
            len += 6;                                                                                                         /* size += 6 */
        }
        if (this.mask & this.DMP_FEATURE_SEND_ANY_GYRO)                                                          /* check the gyro */ {
            if ((this.mask & this.DMP_FEATURE_SEND_RAW_GYRO && !(this.mask & this.DMP_FEATURE_SEND_CAL_GYRO)))                                                          /* check the gyro */ {
                len += 8;                                                                                                         /* size += 8 */
            }
            len += 6;                                                                                                         /* size += 6 */
        }
        if (this.mask & (this.DMP_FEATURE_3X_QUAT | this.DMP_FEATURE_6X_QUAT))                                /* check the quat */ {
            len += 16;                                                                                                        /* size += 16 */
        }
        if (this.mask & (this.DMP_FEATURE_TAP | this.DMP_FEATURE_ORIENT))                                     /* check the tap and orient */ {
            len += 4;                                                                                                         /* size += 4 */
        }
        if (len == 0)                                                                                                         /* check the len */ {
            console.log("mpu6050: no data.\n");                                                                       /* no data */
            return outs;
        }
    
        let count = await this.readWordDataBE(this.REG_FIFO_COUNTH);
        if (count === 0){
            return outs;
        }
        // count of actual sampled data in DMP?
        let dmp_count2 = await this.dmp_get_ulong(this.DMP_COUNTER2_ULONG);
        outs.sample_count_at_read = dmp_count2;
        outs.read_ms = dmp_count2 * this.sample_period_ms;

        count &= 0x3ff;
    
        let l = (count / len)>>0; 
        let readcount = l * len;                                                                                          /* len times */
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

        if (l){
            let packetNum = dmp_count2 - (this.dmp_rate_div+1)*l;
            // try to correct for miss-timed reads or writes to DMP_COUNTER2_ULONG register
            if (packetNum === this.last_dmp_count2){
                packetNum += (this.dmp_rate_div+1);
                outs.packetNum_corrected = (this.dmp_rate_div+1);
            }
            if (packetNum === this.last_dmp_count2 + 2*(this.dmp_rate_div+1)){
                packetNum -= (this.dmp_rate_div+1);
                outs.packetNum_corrected = -(this.dmp_rate_div+1);
            }

            for (let j = 0; j < (l); j++)                                                                                            /* (*l) times */ {
                let out = {};
                // out.dmp_count2 = dmp_count2;
                // this is in base sample periods.
                // this value MAY not be accurate, due to timing of read of the value.
                out.pkt_sample_num = packetNum;
                out.pkt_ms = packetNum * this.sample_period_ms;
                packetNum += (this.dmp_rate_div+1);
                
                this.last_dmp_count2 = packetNum;
        
                let posn = len*j;

                if (this.mask & (this.DMP_FEATURE_3X_QUAT | this.DMP_FEATURE_6X_QUAT))                            /* check the quat */ {
                    //console.log('quat');
                    let q = [];
                    let qs = [];
                    let qsmag = 0;
                    
                    for (let x = 0; x < 16; x += 4){
                        let Qf = this.readQ14ToFloat(buf, posn );
                        posn += 4;
                        let Qs = Qf * Qf; 
                        q.push(Qf);
                        qs.push(Qs);
                        qsmag += Qs;
                    }

                    if ((qsmag > 17/16) || (qsmag < 15/16)){
                        console.log("mpu6050: quat check error qsmag " + (15/16) + ' > ' + qsmag + ' > '+(17/16));                                                      /* quat check error */
                        //await this.reset_fifo();                                                                       /* reset the fifo */
                        //return outs;
                    }

                    let radToDeg = 57.32484;

                    //conventional yaw increases clockwise from North. Not that the MPU-6050 knows where North is.

                    // two different implementaitons, which is better?
/*
                    let roll = Math.atan2((q[0] * q[1] + q[2] * q[3]), 0.5 - (q[1] * q[1] + q[2] * q[2])) * radToDeg;
                    let pitch = Math.asin(2.0 * (q[0] * q[2] - q[1] * q[3])) * radToDeg;
                    let yaw = -Math.atan2((q[1] * q[2] + q[0] * q[3]), 0.5 - (q[2] * q[2] + q[3] * q[3])) * radToDeg;
  */          
                    let roll = Math.atan2(2 * q[2] * q[3] + 2 * q[0] * q[1], -2 * q[1] * q[1] - 2 * q[2] * q[2] + 1) * radToDeg;                           /* set roll */
                    let pitch = Math.asin(-2 * q[1] * q[3] + 2 * q[0] * q[2]) * radToDeg;                                                           /* set pitch */
                    let yaw = Math.atan2(2 * (q[1] * q[2] + q[0] * q[3]), q[0] * q[0] + q[1] * q[1] - q[2] * q[2] - q[3] * q[3]) * radToDeg;                      /* set yaw */

                    out.pitch = pitch;
                    out.roll = roll;
                    out.yaw = yaw;
                    //console.log(pitch, yaw, roll);
                    out.q = q;
                }
                if ((this.mask & this.DMP_FEATURE_SEND_RAW_ACCEL) != 0)                                                     /* check the accel */ {
                    let accel_raw = [];
                    let accel_g = [];

                    for (a = 0; a < 3; a++){
                        accel_raw.push(this.readInt16BE(buf, posn));                                  /* set raw accel x */
                        accel_g.push(accel_raw[a]/this.accScale);
                        posn += 2;
                    }
                    out.accel_raw = accel_raw;
                    out.accel_g = accel_g;
                }
                if ((this.mask & this.DMP_FEATURE_SEND_ANY_GYRO) != 0)                                                      /* check the gyro */ {
                    if ((this.mask & this.DMP_FEATURE_SEND_RAW_GYRO && !(this.mask & this.DMP_FEATURE_SEND_CAL_GYRO)))                                                          /* check the gyro */ {
                        console.log('gyro extra');
                        out.gyro_extra = buf.slice(posn, posn+8);
                        posn += 8;
                    }
                    let gyro_raw = [];
                    let gyro_dps = [];

                    for (a = 0; a < 3; a++){
                        gyro_raw.push(this.readInt16BE(buf, posn));                                   /* set raw gyro x */
                        gyro_dps.push(gyro_raw[a]/this.gyroScale);
                        posn += 2;
                    }
                    out.gyro_raw = gyro_raw;
                    out.gyro_dps = gyro_dps;
                }
                if ((this.mask & (this.DMP_FEATURE_TAP | this.DMP_FEATURE_ORIENT)) != 0)                                 /* check the tap and orient */ {
                    // 4 bytes?
                    out.gesture = this.dmp_decode_gesture(buf.slice(posn, posn+4));                                              /* run the decode gesture */
                    posn += 4;
                }
                outs.packets.push(out);
            }
        }    
        return outs;                                                                                                             /* success return 0 */
    }
    
    MPU6050Inst.dmp_set_enable = async function (enable) {
        await this.set_reg_bit(this.REG_USER_CTRL, 7, enable);
    }
    
}

module.exports = addDmp;