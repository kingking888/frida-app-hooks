// hook sig
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


function stringToBytes(str) {
    var ch, st, re = [];
    for (var i = 0; i < str.length; i++) {
        ch = str.charCodeAt(i);
        st = [];
        do {
            st.push(ch & 0xFF);
            ch = ch >> 8;
        }
        while (ch);
        re = re.concat(st.reverse());
    }
    return re;
}

function call_getClock() {
    // console.log(base)
    // input_str0123456789 + 382700b563f4
    // md5(input_str +"382700b563f4")

    Java.perform(function () {
        var signCls = Java.use('com.yxcorp.gifshow.util.CPU');
        var context = Java.use("android.content.Context").$new();
        var input_str = 'dsfhdshfhfdhehfdhfdshdshdhrdahrew';
        var bytearray = stringToBytes(input_str);
        console.log(bytearray)
        var int_a = 27;
        var result = signCls.getClock(context, bytearray, int_a);
        console.log('call  java:', result)
    })
}

function hook_java() {

    Java.perform(function () {

        var signCls = Java.use('com.yxcorp.gifshow.util.CPU');
        signCls.getClock.implementation = function (a, b, c) {
            var result = this.getClock(a, b, c);
            console.log("inputer str:", bytesToString(b));
            console.log("inputer str:", (c));
            // console.log("inputer bytearray:",JSON.stringify(b));
            console.log("result:", result);

            // var stack = threadinstance.currentThread().getStackTrace();
            // console.log("Full call stack:" + Where(stack));

            return result;
        }
    })


}


function hook_Java_com_yxcorp_gifshow_util_CPU_getClock() {

    // hook_java()
    var base = Module.findBaseAddress("libcore.so");

    if (base) {
        var sub_0x2f40 = base.add(0x2f40);
        Interceptor.attach(sub_0x2f40, {
            onEnter: function (args) {
                this.arg0 = args[0]
                this.arg1 = args[1]
                console.log("sub_0x2f40 onEnter:\n", hexdump(args[0]), "\r\n", hexdump(args[1]))
            }, onLeave: function (retval) {
                console.log("sub_0x2f40 onLeave:", hexdump(this.arg0))
            }

        })
    }


}


function main() {
    hook_Java_com_yxcorp_gifshow_util_CPU_getClock()
}


setImmediate(main)