function print_arg(addr) {
    var range = Process.findRangeByAddress(addr);
    if (range) {
        return hexdump(addr) + '\n'
    } else {
        return ptr(addr) + "\n"
    }
}

function hook_addr(addr, stack) {
    var module = Process.findModuleByAddress(addr);
    Interceptor.attach(addr, {
        onEnter: function (args) {
            this.logs = []
            this.arg0 = args[0];
            this.arg1 = args[1];
            this.arg2 = args[2];
            this.arg3 = args[3];
            this.arg4 = args[4];
            this.logs.push("module: ", module.name, " !address: ", ptr(addr).sub(module.base), "\n")
            if (stack) {
                this.logs.push('called from:\n' +
                    Thread.backtrace(this.context, Backtracer.ACCURATE)
                        .map(DebugSymbol.fromAddress).join('\n') + '\n');
            }
            this.logs.push("this.arg0:\r\n", print_arg(args[0]))
            this.logs.push("this.arg1:\r\n", print_arg(args[1]))
            this.logs.push("this.arg2:\r\n", print_arg(args[2]))
            this.logs.push("this.arg3:\r\n", print_arg(args[3]))
            this.logs.push("this.arg4:\r\n", print_arg(args[4]))
        }, onLeave: function (retval) {
            this.logs.push("this.arg0: onLeave \r\n", print_arg(this.arg0))
            this.logs.push("this.arg1: onLeave \r\n ", print_arg(this.arg1))
            this.logs.push("this.arg2: onLeave \r\n  ", print_arg(this.arg2))
            this.logs.push("this.arg3: onLeave \r\n", print_arg(this.arg3))
            this.logs.push("this.arg4: onLeave \r\n", print_arg(this.arg4))
            this.logs.push("retval:    onLeave \r\n", print_arg(retval))
            console.log(this.logs)
        }
    })

}

function stalker_call() {
    var base_native_lib = Module.findBaseAddress("libcore.so")
    // console.log("base", base_native_lib)
    var jni_addr = Module.getExportByName("libcore.so", "Java_com_yxcorp_gifshow_util_CPU_getClock");
    // var sub_2F88 = base_native_lib.add(0x2F88);
    Interceptor.attach(jni_addr, {
        onEnter: function (args) {
            this.tid = Process.getCurrentThreadId();
            console.log('follow!')
            Stalker.follow(this.tid, {
                // Use `Stalker.parse()` to examine the data.
                events: {
                    call: true,
                    ret: false,
                    exec: false,
                    block: false,
                    compile: false,
                },
                // onEvent: {},
                // transform: {},
                // onReceive: function (events) {
                //     var all_events = Stalker.parse(events)
                //     console.log("events:", all_events, "length:", all_events.length);
                //     for (var i = 0; i < all_events.length; i++) {
                //         var event = all_events[i];
                //         var event_type = event[0]
                //         if (event_type === 'call') {
                //             var addr1 = event[1];
                //             var addr2 = event[2];
                //             var module1 = Process.findModuleByAddress(addr1);
                //             var module2 = Process.findModuleByAddress(addr2);
                //             if (module1 != null && module1.name.indexOf('libnative-lib.so') >= 0) {
                //                 try {
                //                     console.log("caller:", module1.name, "!", addr1, "called---", module2.name, "!", addr2)
                //                 } catch (e) {
                //                     console.log(e)
                //                 }
                //             }
                //         }
                //
                //     }
                //
                // },
                onCallSummary: function (summary) {
                    // [target: string]: number;
                    for (var target in summary) {
                        var call_number = summary[target];
                        var module = Process.findModuleByAddress(target);
                        if (module != null && module.name.indexOf("libcore.so") >= 0) {
                            console.log("call:", module.name, "!", ptr(target).sub(module.base), call_number)
                        }
                    }
                }
            })
        }, onLeave: function (retval) {
            Stalker.unfollow(this.tid)
            console.log("Stalker.unfollow!")
        }

    })


}


function bytesToString(arr) {
    if (typeof arr === 'string') {
        return arr;
    }

    var str = '',
        _arr = arr;
    for (var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if (v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for (var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
}


function hook_java() {

    Java.perform(function () {
        console.log("hooking....")
        var signCls = Java.use('com.yxcorp.gifshow.util.CPU');
        signCls.getClock.implementation = function (a, b, c) {
            var result = this.getClock(a, b, c);
            console.log("inputer str:", bytesToString(b));
            // console.log("inputer bytearray:",JSON.stringify(b));
            console.log("result:", result);

            // var stack = threadinstance.currentThread().getStackTrace();
            // console.log("Full call stack:" + Where(stack));

            return result;
        }
    })


}



function hook_native() {

    hook_java()
    var base_native_lib = Module.findBaseAddress("libcore.so")

    // hook_addr(base_native_lib.add(0xf50)) strlen
    // hook_addr(base_native_lib.add(0xf40)) sprintf
    // hook_addr(base_native_lib.add(0xf30)) cpu_clock_release
    hook_addr(base_native_lib.add(0x2f40))
    // hook_addr(base_native_lib.add(0xf20)) cpu_clock_x
    // hook_addr(base_native_lib.add(0xf10)) cpu_clock_start

}



function main() {
    // stalker_call()
    hook_native()

}

setImmediate(main)