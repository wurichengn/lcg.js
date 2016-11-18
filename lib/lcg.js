//======组件系统(核心部分)======
!function(){
	//初始化
	window.lcg = window.lcg || {};

	//======组件核心======
	//组件表
	var modules = {};
	lcg.getModule = function(key){
		return modules[key];
	}
	//绑定组件
	lcg.bind = function(name,vals){
		modules[name] = vals;
		vals._moduleName = name;
		//继承
		if(vals.extend)
			extendFor(vals);
		for(var i in vals)
			if(typeof vals[i] == "function")
				vals[i]._module = vals;
		//触发bind
		trigger("bind",{name:name,vals:vals});
	}

	//继承
    var extendFor = function(cls){
        if(cls._isextend == true)
            return;
        //父组件内容传递
        var par = modules[cls.extend];
        cls._extend = cls.extend;
        for(var i in par)
            if(cls[i] == null && !keyss[i])
                cls[i] = par[i];
            else
                if(!keyss[i] && typeof par[i] == "function")
                    cls[i]._par = par;
        //调用父组件方法
        cls._parent = function(){
        	return run_parent(this,arguments);
        }
        cls._isextend = true;
    }

    //不传递的关键字
    var keyss = {
        "extend":true,
        "_isextend":true,
        "_moduleName":true
    }

    //执行父对象方法
    var run_parent = function(obj,args){
        var name = args[0];
        var arg_in = [];
        for(var i = 1;i < args.length;i++)
            arg_in.push(args[i]);
        var func = run_parent;
        while(func != null && !func._par)
        	func = func.caller;
        var par = func && func._par;
        if(par)
        	return par[name].apply(obj,arg_in);
    }

	//生成组件
	lcg.create = function(name,vals){
		var vals = vals || {};
		var re = trigger("create",{name:name,vals:vals});
		if(re != null)
			return re;
		//获取组件
		var cls = modules[name];
		if(cls == null)
            return;
        //渲染
        return lcg.render(cls,null,vals);
	}

	//消息触发器
	var TriggerMessage = function(dom){
		var cb = function(name){
			var args = [];
			for(var i = 1;i < arguments.length;i++)
				args.push(arguments[i]);
			for(var i in dom._modules)
				if(dom._modules[i][name] && typeof dom._modules[i][name] == "function")
					dom._modules[i][name].apply(dom,args);
		}
		return cb;
	}

	//函数调用器
	var FuncHash = function(dom,name,module){
		var Rfunc = module[name];
		var use = null;
		var cb = function(){
			//判断函数模型
			var func = cb;
			var isInModules = function(md){
				for(var i in dom._modules)
					if(dom._modules[i] == md)
						return true;
			}
			var max_num = 30,num = 0;
			while(func!=null && (!func._module || !isInModules(func._module)) && func.caller != cb)
			{
				num++;
				if(num > max_num)
					break;
				func = func.caller;
			}

			//如果是引用模式
			if(use){
				use = null;
				if(dom._modules[use][name] && typeof dom._modules[use][name] == "function")
					return dom._modules[use][name].apply(dom,arguments);
			}
			else
			//作用域module
			if(func && func._module)
			{
				if(func._module[name])
					return func._module[name].apply(dom,arguments);
			}
			else
				//默认module
				return Rfunc.apply(dom,arguments);
		}
		cb._isModuleFunc = true;
		cb.use = function(name){
			use = name;
			return cb;
		}
		cb.message = function(){
			var args = [name];
			for(var i = 0;i < arguments.length;i++)
				args.push(arguments[i]);
			return dom._message.apply(dom,args);
		}
		return cb;
	}

	//加入组件
	lcg.use = function(proxy,name,vals){
		var vals = vals || {};
		var re = trigger("use",{name:name,vals:vals});
		if(re != null)
			return re;
		//获取组件
		var cls = modules[name];
		if(cls == null)
            return;
        //渲染
        return lcg.render(cls,proxy,vals);
	}

	//通过定义类生成组件
	lcg.render = function(cls,main,vals,noInit){
		if(!main)
		{
			//通过代理获取主体
	        if(cls.proxy && typeof cls.proxy == "function")
	        	main = cls.proxy(vals);
	        if(!main)
	        	main = {};
    	}

    	//加入组件
    	if(main._modules == null)
    		main._modules = {};
    	main._modules[cls._moduleName] = cls;
        //转移内容
        for(var i in cls)
        {
        	if(!keyss[i])
        	{
        		if(typeof cls[i] != "function")
        			main[i] = cls[i];
        		else
        		{
        			if(main[i] == null || main[i]._isModuleFunc != true)
        				main[i] = FuncHash(main,i,cls);
        		}
        	}
        }
        main._message = TriggerMessage(main);
        //创建事件
        if(!noInit && cls.init)
            cls.init.call(main,vals);
        return main;
	}






	//======事件系统======
	//事件表
	var events = {
		"bind":[]
	};

	//帧听事件
	lcg.on = function(name,cb){
		if(events[name] == null)
			events[name] = [];
		events[name].push(cb);
	}

	//触发事件
	var trigger = function(name,vals){
		if(events[name] == null)
			events[name] = [];
		var isEnd = false;
		vals = vals || {};
		vals.stop = function(){
			isEnd = true;
		}
		vals.type = name;
		//循环触发回调
		for(var i in events[name])
		{
			//去除空回调
			var es = events[name];
			if(!es[i])
				es.splice(i,1);
			//触发回调
			var re = es[i](vals);
			if(isEnd)
				return re;
		}
	}
	lcg.trigger = trigger;

	//文档载入完毕事件
	var ready = function(fn){
        if(document.addEventListener){//兼容非IE  
            document.addEventListener("DOMContentLoaded",function(){  
                //注销事件，避免反复触发  
                document.removeEventListener("DOMContentLoaded",arguments.callee,false);  
                fn();//调用参数函数  
            },false);  
        }else if(document.attachEvent){//兼容IE  
            document.attachEvent("onreadystatechange",function(){  
                if(document.readyState==="complete"){  
                    document.detachEvent("onreadystatechange",arguments.callee);  
                    fn();  
                }  
            });  
        }
    }


    //帧听文档事件触发ready
    ready(function(){
    	//如果引入了jquery进行兼容性处理
    	if(window.jQuery)
    	{
	    	//jquery兼容
		    document.querySelectorAll = Element.prototype.querySelectorAll = function(s){
		    	return jQuery(this).find(s);
		    }

		    //单个query
		    document.querySelector = Element.prototype.querySelector = function(s){
		    	return jQuery(this).find(s)[0];
		    }
		}


    	//触发插件准备事件
    	trigger("plugin-ready");
    	//触发准备完毕事件
    	trigger("ready");
    });
}();