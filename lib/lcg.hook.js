//======钩子模块======
//用于数据变化帧听
!function(){
    var hook = {};
    lcg.hook = hook;

    //复制数组
    lcg.copyArray = function(arr,end,start){
        var end = end || 9999999;
        var start = start || 0;
        var re = [];
        for(var i = start;i < arr.length && i<end;i++)
            re.push(arr[i]);
        return re;
    }

    //绑定数组
    hook.bindArray = function(arr,cbp,cbd){
        var push = arr.push;
        var splice = arr.splice;

        //重写push
        arr.push = function(){
            //执行原来的方法
            push.apply(arr,arguments);
            cbp(arguments);
        }

        //重写 splice
        arr.splice = function(start,del,add){
            //执行原来的方法
            splice.apply(arr,arguments);
            //如果删除了
            if(del > 0)
                cbd(start,del);
            //如果插入了
            if(arguments.length > 2)
            {
                var adds = lcg.copyArray(arguments,null,2);
                cbp(adds,start);
            }
        }
        return {push:push,splice:splice};
    }


    //绑定对象的key
    hook.bindKeySet = function(dom,key,set,data){
        var myvals = dom[key];
        var getter = function(){
            return myvals;
        };
        var setter = function(val){
            myvals = val;
            if(set)
                set(val,key,data);
        }

        //添加getter、setter
        if (Object.defineProperty){
            Object.defineProperty(dom, key, {get: getter,set: setter});
        }else{
            Object.prototype.__defineGetter__.call(dom, key, getter);
            Object.prototype.__defineSetter__.call(dom, key, setter);
        }
    }
}();