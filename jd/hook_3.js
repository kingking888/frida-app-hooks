function hook_native() {
    var base_hello_jni = Module.findBaseAddress("libhello-jni.so");
    if (base_hello_jni) {
        //从输入参数找到算法加密的过程

        var sub_13558 = base_hello_jni.add(0x13558);
        // Interceptor.attach(sub_13558, {
        //     onEnter: function (args) {
        //         this.result = args[0];
        //         console.log("sub_13558 onEnter:", ptr(args[1]).readCString());
        //     }, onLeave: function (retval) {
        //         console.log("sub_13558 onLeave:", ptr(retval).readCString());
        //     }
        // });

        var sub_12D70 = base_hello_jni.add(0x12D70);
        Interceptor.attach(sub_12D70, {
            onEnter: function (args) {
                this.str_1_str = args[0];
                this.str_2_str = args[1];
                this.arg2 = args[2];

                console.log("sub_12D70 onEnter str1:", ptr(this.str_1_str).add(1).readCString(), " str2:", ptr(this.str_2_str).add(1).readCString());
            }, onLeave: function (retval) {
                console.log("sub_12D70 onLeave str1:", ptr(this.str_1_str).add(1).readCString(), " str2:", ptr(this.str_2_str).add(1).readCString());

                console.log("sub_12D70 onLeave arg2:", hexdump(ptr(this.arg2).add(Process.pointerSize).readPointer()));
            }
        });

        //ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/
        //base64 table
        //0123456789abcdefgh
        //MDEyMzQ1Njc4OWFiY2RlZmdo
        var sub_162B8 = base_hello_jni.add(0x162B8);
        Interceptor.attach(sub_162B8, {
            onEnter: function (args) {
                this.arg2 = args[2];
                console.log("sub_162B8 onEnter:", hexdump(args[0]), "\r\n", args[1]);
            }, onLeave: function (retval) {
                console.log("sub_162B8 onLeave:", hexdump(this.arg2), "\r\n", ptr(retval).readCString());
            }
        });

        var sub_130F0 = base_hello_jni.add(0x130F0);
        Interceptor.attach(sub_130F0, {
            onEnter: function (args) {
                this.arg0 = args[0];

            }, onLeave: function (retval) {
                console.log("sub_130F0 onLeave:", hexdump(this.arg0));
            }
        });

        var sub_15F1C = base_hello_jni.add(0x15F1C);
        Interceptor.attach(sub_15F1C, {
            onEnter: function (args) {
                this.arg2 = args[2];
                console.log("sub_15F1C onEnter:", ptr(args[0]).readCString(), this.arg2);
            }, onLeave: function (retval) {
                console.log("sub_15F1C onLeave:", hexdump(this.arg2));
            }
        });

        var sub_154D4 = base_hello_jni.add(0x154D4);
        Interceptor.attach(sub_154D4, {
            onEnter: function (args) {
                this.arg0 = args[0];
                console.log("sub_154D4 onEnter:", ptr(args[1]).readCString(), "\r\n");
                console.log("sub_154D4 onEnter:", hexdump(args[1], { length: parseInt(args[2]) }));
            }, onLeave: function (retval) {
                //console.log("sub_154D4 onLeave:", hexdump(this.arg0));
            }
        });

        //从输出结果回溯加密过程

        //ab4bbe85ae0e866f8648d5e8aa899506
        var sub_158AC = base_hello_jni.add(0x158AC);
        Interceptor.attach(sub_158AC, {
            onEnter: function (args) {
                this.arg1 = args[1];
            }, onLeave: function (retval) {
                console.log("sub_158AC onLeave:", hexdump(this.arg1));
            }
        });
    }
}

function hook_sign2() {
    Java.perform(function () {
        var HelloJni = Java.use("com.example.hellojni.HelloJni");
        HelloJni.sign2.implementation = function (str, str2) {
            var result = this.sign2(str, str2);
            console.log("HelloJni.sign2:", str, str2, result);
            return result;
        };
    });
}

function call_sign2() {
    Java.perform(function () {
        Java.choose("com.example.hellojni.HelloJni", {
            onMatch: function (ins) {
                var result = ins.sign2("0123456789", "abcdefghakdjshgkjadsfhgkjadshfg");
                console.log(result);
            }, onComplete: function () {
            }
        });
    });
}

function main() {
    hook_native();
    hook_sign2();
}


setImmediate(main);
