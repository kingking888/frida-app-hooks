function hook_stringbuiler() {
    Java.perform(function () {
        console.log("111111111111111")
        const StringBuilder = Java.use('java.lang.StringBuilder');
        StringBuilder.toString.implementation = function () {
            var res = this.toString();
            var tmp = "";
            if (res !== null) {
                tmp = res.toString().replace("/n", "");
                console.log(tmp)
                // if (tmp.indexOf(FLAG) >= 0) {
                //     let logs = []
                //     logs.push('\n')
                //     logs.push("==============================================================")
                //     logs.push(tmp)
                //     logs.push(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()))
                //     logs.push("==============================================================")
                //     console.log(logs.join('\n')
                //     )
                // }
            }
            return res;
        };

    });

}

function main() {
    hook_stringbuiler()

}

setImmediate(main)