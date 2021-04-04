// frida -UF com.ss.android.ugc.aweme -l hook_xg.js

function hook_java() {
    Java.perform(function (args) {
        var  a =  Java.use("com.ss.sys.ces.a");
        a.leviathan.implementation = function ( i , i2 , barr) {
            console.log("0:" , i)
            console.log("1:" , i2)
            console.log("2:" ,barr)
            console.log( 'classloader:' ,this.class.getClassLoaders())
            var result =  this.leviathan.apply(this , arguments ) ;
            return result

        }
    })

}


function main() {
    hook_java()
}

setImmediate(main)
