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
}();//======钩子模块======
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
}();//Style组件 样式控制器
!function(){
	var sf = {};
	lcg.style = lcg.style || sf;

	sf.setStyleText = function(style,str){
		style.loadingStr = str;
		try{
            var textNode = document.createTextNode(str);
            style.appendChild(textNode);
        }catch(e){
        	if(style.styleSheet)
            	style.styleSheet.cssText = str;
            else
            {
            	var set = function(){
            		try{
            			style.styleSheet.cssText = str;
            		}catch(e){
            			
            		}
            	}
            	setTimeout(set);
            }
        }
	}

	//组件核心
	lcg.bind("style-module",{
		//代理
		proxy:function(){
			return document.createElement("style");
		},
		//初始化
		init:function(vals){
			var zhu = this;
			//设置值
			this.vars = {};
			if(vals.vars)
				for(var i in vals.vars)
					this.vars[i] = vals.vars[i];
			//获取处理器
			loadStyle(vals.name,function(re){
				zhu._fac = re;
				zhu.render();
			});
		},
		//设置值
		setVars:function(vars){
			for(var i in vars)
				this.vars[i] = vars[i];
		},
		//渲染
		render:function(){
			if(!this._fac)
				return;
			sf.setStyleText(this,this._fac.getCSS(this.vars));
		}
	});


	//样式列表
	var styles = {};

	//载入回调
	loaders = {};

	//载入样式
	var loadStyle = function(name,cb){
		if(styles[name])
			cb(styles[name]);
		else
		{
			if(!loaders[name])
				loaders[name] = [];
			loaders[name].push(cb);
		}
	}

	//文档载入完成事件
	lcg.on("ready",function(){
		var styleList = document.querySelectorAll("style");
		for(var i = 0;i < styleList.length;i++)
		{
			if(styleList[i].getAttribute("style-module") == null)
				continue;
			var key = styleList[i].getAttribute("style-module");
			styles[key] = new fac(styleList[i].loadingStr || styleList[i].innerHTML);
			styleList[i].parentNode.removeChild(styleList[i]);
			if(loaders[key])
				for(var i in loaders[key])
					loaders[key][i](styles[key]);
		}
	});

	//构造器
	var fac = function(str){
		this.str = str;
		this.inits = [];
		this.jx();
	}

	//构造器核心
	fac.prototype = {
		//构造字符串为字符数组
		jx:function(){
			var varArr = this.str.match(/var\(.*?,.*?\)/g);
			var strArr = this.str.split(/var\(.*?,.*?\)/g);
			this.jxArr = [];
			//加入到核心列表
			for(var i in strArr)
			{
				if(i > 0)
					this.jxArr.push("");
				this.jxArr.push(strArr[i]);
			}
			//解析变量
			for(var i = 0;i < varArr.length;i++)
			{
				var val = varArr[i].match(/var\((.*),(.*)\)/);
				this.inits.push({key:val[1],init:val[2],id:i*2+1});
			}
		},
		//获取相应变量值的CSS代码
		getCSS:function(vals){
			for(var i in this.inits)
				if(vals[this.inits[i].key])
				{
					if(typeof vals[this.inits[i].key] == "function")
						this.jxArr[this.inits[i].id] = vals[this.inits[i].key](vals);
					else
						this.jxArr[this.inits[i].id] = vals[this.inits[i].key];
				}
				else
					this.jxArr[this.inits[i].id] = this.inits[i].init;
			return this.jxArr.join("");
		}
	}


	//======全局主题======
	var styleVars = {};

	//设置全局主题
	sf.setVars = function(vars){
		for(var i in vars)
			styleVars[i] = vars[i];
	}
	
}();//======DOM组件系统======
!function(){
    //Dom组件核心
    var dm = {};
    lcg.domModule = dm;

    //绑定组件
    //Dom组件
    lcg.bind("dom-module",{
        //初始化
        init:function(){
            this.initFab();
            this.initLists();
            this.initIDS();
            this.initModuleRoot();
            this.initDomVal();
        },
        //初始化数组侦听
        initLists:function(){
            initLists(this);
        },
        //初始化编号获取
        initIDS:function(){
            initIDS(this);
        },
        //初始化子节点的ModuleRoot
        initModuleRoot:function(){
            initModuleRoot(this);
        },
        //初始化数据绑定
        initDomVal:function(){
            initDomVal(this);
        },
        //初始化预制
        initFab:function(){
            initFab(this);
        }
    });
    //影子Dom组件
    lcg.bind("sdom-module",{
        extend:"dom-module",
        //宿主
        host:function(vals,dom){
            var re = document.createElement("div");
            if(dom)
                for(var i = dom.childNodes.length - 1;i >= 0;i--)
                    re.appendChild(dom.childNodes[i]);
            return re;
        }
    });


    //组件表
    var modules = {};
    var prefabs = {};

    //帧听绑定事件
    lcg.on("bind",function(e){
        //如果继承自DOM组件
        if(lcg.extendForm(e.vals,"dom-module"))
            modules[e.name] = e.vals;
        if(lcg.extendForm(e.vals,"sdom-module"))
            e.vals._isShadowDom = true;
    });

    //创建事件
    lcg.on("create",function(e){
        if(lcg.extendForm(lcg.getModule(e.name),"dom-module") || lcg.extendForm(e.name,"sdom-module"))
        {
            e.stop();
            return dm.init(e.name,null,e.vals);
        }
    });

    //组件祖先是否为dom-module
    lcg.extendForm = function(vals,name){
        if(vals.extend == null)
            return false;
        if(vals.extend == name)
            return true;
        return lcg.extendForm(lcg.getModule(vals.extend),name);
    }

    //预制关键字属性
    var keyssFab = {
        "type":true,
        "values":true,
        "dom-prefab":true
    };
    //文档载入事件
    lcg.on("ready",function(){
        //保存组件相应的HTML
        for(var i in modules){
            var dom = document.querySelector("*[dom-module='"+i+"']");
            prefabs[i] = dom.outerHTML;
            dom.parentNode.removeChild(dom);
        }
        //初始化所有预制
        initFab(document);
    });

    //初始化预制
    var initFab = function(dom){
        //创建相应的预制
        var fabs = dom.querySelectorAll("dom-prefab,*[dom-prefab]");
        for(var i = 0;i < fabs.length;i++)
        {
            //从属性中获取预制
            var vals = {};
            if(fabs[i].getAttribute("values"))
                vals = eval("("+fabs[i].getAttribute("values")+")");
            //初始化组件
            dm.init(fabs[i].getAttribute("dom-prefab") || fabs[i].getAttribute("type"),fabs[i],vals);
        }
    }


    //转移属性
    var moveAttribute = function(from,to){
        //从属性获取初值
        for(var j = 0;j < from.attributes.length;j++)
        {
            var atts = from.attributes[j];
            if(keyssFab[atts.name] != true)
                to.setAttribute(atts.name,atts.value);
        }
    }


    //创建初始化一个组件
    dm.init = function(name,dom,vals,noInit){
        if(modules[name]._isShadowDom)
        {
            //shadowDom结构
            var div = modules[name].host;
            if(typeof modules[name].host == "function")
                div = modules[name].host(vals,dom);
            moveAttribute(dom,div);
            var sd = div.createShadowRoot();
            sd.innerHTML = prefabs[name];
            if(dom && dom.parentNode)
            {
                dom.parentNode.insertBefore(div,dom);
                dom.parentNode.removeChild(dom);
            }
            dom = sd;
        }
        else
        {
            //普通Dom结构
            if(dom == null)
                dom = document.createElement("div");
            dom.innerHTML = prefabs[name];
            var domz = dom.querySelector("*");
            moveAttribute(dom,domz);
            if(dom.parentNode)
            {
                dom.parentNode.insertBefore(dom.querySelector("*"),dom);
                dom.parentNode.removeChild(dom);
            }
            dom = domz;
        }

        //构造LCG组件并阻止初始化
        var re = lcg.render(modules[name],dom,vals,true);
        //保存宿主
        if(modules[name]._isShadowDom)
            re.host = div;

        //执行初始化
        if(!noInit && re.init)
            re.init(vals);
        //触发初始化事件
        lcg.trigger("dom-module-init",{name:name,dom:dom,vals:vals});
        return re;
    }

    //初始化ID表
    var initIDS = function(dom){
        var ids = {};
        var idoms = dom.querySelectorAll("*[lid]");
        for(var i = 0;i < idoms.length;i++)
        {
            var attr = idoms[i].getAttribute("lid");
            if(ids[attr] == null)
                ids[attr] = idoms[i];
        }
        dom.ids = ids;
    }


    //======组件列表======
    //初始化所有组件列表
    var initLists = function(dom){
        var lists = dom.querySelectorAll("*[dom-list]");
        for(var i = 0;i < lists.length;i++)
            initList(lists[i],dom);
        if(dom.getAttribute && dom.getAttribute("dom-list") != null)
            initList(dom,dom);
    }

    //初始化组件列表
    var initList = function(dom,root){
        var vals = dom.getAttribute("dom-list");
        var kv = vals.split(":");
        var domList = [];
        //获取数组
        var arr = root[kv[0]];
        if(arr == null)
            return;
        arr.fabList = domList;
        arr.module = root;
        //删除方法
        arr.del = function(module){
            for(var i in domList)
            {
                if(module._isShadowDom)
                {
                    if(domList[i] == module.host)
                        arr.splice(Number(i),1);
                }
                else
                    if(domList[i] == module)
                        arr.splice(Number(i),1);
            }
        }
        //生成一个fab
        var create = function(datas){
            //创建并阻止初始化
            var fab = dm.init(kv[1],null,datas,true);
            fab._fabList = arr;
            if(fab.init)
                fab.init(datas);
            //影子节点特殊处理
            if(fab._isShadowDom)
                return fab.host;
            return fab;
        }
        //初始化数组原有内容
        for(var i = 0;i < arr.length;i++){
            arr[i]._id = i;
            var fab = create(arr[i]);
            dom.appendChild(fab);
            domList.push(fab);
        }
        //绑定数组方法
        lcg.hook.bindArray(arr,
            //插入数据
            function(datas,start){
                //加入非插入
                if(start == null || start == 0)
                    for(var i in datas){
                        //传递下标初始化组件
                        datas[i]._id = domList.length;
                        var fab = create(datas[i]);
                        dom.appendChild(fab);
                        domList.push(fab);
                    }
                else
                {
                    //插入
                    var startDom = domList[start];
                    for(var i in datas){
                        //传递下标初始化组件
                        datas[i]._id = start+i;
                        var fab = create(datas[i]);
                        //插入相应内容
                        dom.insertBefore(fab,startDom);
                        domList.splice(start+i,0,fab);
                    }
                }
            },
            //删除数据
            function(start,len){
                for(var i = 0;i < len;i++)
                    dom.removeChild(domList[start + i]);
                domList.splice(start,len);
            });
    }



    //======moduleRoot传递======
    var initModuleRoot = function(dom){
        var dlist = dom.querySelectorAll("*");
        for(var i = 0;i < dlist.length;i++)
            if(dlist[i].$root == null)
                dlist[i].moduleRoot = dlist[i].$root = dom;
    }



    //======对象绑定======
    var initDomVal = function(dom,root){
        root = root || dom;
        //如果是shadowDom
        if(dom.nodeName == "#document-fragment")
        {
            //判断子节点
            for(var i = 0;i < dom.childNodes.length;i++)
                initDomVal(dom.childNodes[i],root)
            return;
        }
        //如果是文本
        if(dom.nodeName == "#text"){
            var re = dom.data.match(/{{.*?}}/);
            if(re && re.length > 0)
                listenerText(dom,root);
            return;
        }
        //判断是否需要绑定
        var re = dom.outerHTML.match(/{{.*?}}/);
        if(re && re.length > 0)
        {
            //判断子节点
            for(var i = 0;i < dom.childNodes.length;i++)
                initDomVal(dom.childNodes[i],root)
        }
        //判断属性是否绑定
        for(var i = 0;i < dom.attributes.length;i++){
            var atts = dom.attributes[i];
            var re = atts.value.match(/{{.*?}}/);
            if(re && re.length > 0)
                listenerAttr(atts,root);
        }
    }

    //侦听文本变化
    var listenerText = function(dom,root){
        var jxList = dom.data.match(/{{.*?}}|[\s\S]/g);
        for(var i in jxList)
            if(jxList[i].length > 3)
                listenerOnce(jxList[i],root,function(val,i){
                    jxList[i] = val;
                    dom.data = jxList.join("");
                },i);
    }

    //侦听属性变化
    var listenerAttr = function(atts,root){
        var jxList = atts.value.match(/{{.*?}}|[\s\S]/g);
        for(var i in jxList)
            if(jxList[i].length > 3)
                listenerOnce(jxList[i],root,function(val,i){
                    jxList[i] = val;
                    atts.value = jxList.join("");
                },i);
    }

    //侦听一次变化
    var listenerOnce = function(str,root,cb,data){
        root.__bindKeyList = root.__bindKeyList || {};
        var key = str.match(/{{(.*?)}}/)[1];
        //初始化绑定列表
        if(root.__bindKeyList[key] == null)
            root.__bindKeyList[key] = [];
        var list = root.__bindKeyList[key];
        //加入回调
        cb._data = data;
        list.push(cb);
        cb(root[key],data);
        //如果没有绑定过
        if(!list._isbind)
        {
            list._isbind = true;
            //绑定变化
            lcg.hook.bindKeySet(root,key,function(val){
                for(var i=0;i < list.length;i++)
                    list[i](val,list[i]._data);
            });
        }
    }
    
}();



//======预载入HTML======
!function(){
    //插件载入事件
    lcg.on("plugin-ready",function(){
        var loaders = document.querySelectorAll("loader,*[dom-loader]");
        for(var i = 0;i < loaders.length;i++)
        {
            var src = loaders[i].getAttribute("src") || loaders[i].getAttribute("dom-loader");
            loadOne(loaders[i],src);
        }
    });


    //属性字符串转属性
    var str2Attr = function(dom,str){
        var kvs = str.match(/[a-zA-Z0-9\-]*=".*?"/g);
        for(var i = 0;i < kvs.length;i++)
        {
            var kv = kvs[i].match(/([a-zA-Z0-9\-]*)="(.*?)"/);
            dom.setAttribute(kv[1],kv[2]);
        }
    }


    //载入一个节点
    var loadOne = function(dom,src){
        lcg.ajax.get(src,function(res){
            var scripts = res.match(/<script.*?>[\s\S]*?<\/script>/g);
            var styles = res.match(/<style.*?>[\s\S]*?<\/style>/g);
            res = res.replace(/<script.*?>[\s\S]*?<\/script>|<style.*?>[\s\S]*?<\/style>/g,"");
            dom.innerHTML = res;
            for(var i = dom.childNodes.length - 1;i >= 0;i--)
                dom.parentNode.insertBefore(dom.childNodes[i],dom);
            //执行脚本
            if(scripts)
                for(var i = 0;i < scripts.length;i++)
                    eval(scripts[i].match(/<script.*?>([\s\S]*?)<\/script>/)[1]);
            //加入样式
            if(styles)
                for(var i = 0;i < styles.length;i++)
                {
                    var style = document.createElement("style");
                    lcg.style.setStyleText(style,styles[i].match(/<style.*?>([\s\S]*?)<\/style>/)[1]);
                    str2Attr(style,styles[i].match(/<style(.*?)>[\s\S]*?<\/style>/)[1]);
                    dom.parentNode.insertBefore(style,dom);
                }
            //删除载入的标记节点
            dom.parentNode.removeChild(dom);
        },false);
    }
}();/*Ajax扩展*/
!function(){


	//默认参数
	var initOptions = {
		//地址
		url:"",
		//方法类型
		method:"GET",
		//是否异步
		async:true,
		//用户名
		user:"",
		//密码
		password:"",
		//头部表
		headers:null,
		//成功返回
		onSuccess:null,
		//返回失败
		onError:null,
		//参数
		vars:null
	};


	//ajax核心方法
	var ajax = function(option)
	{
		//参数设置
		for(var i in initOptions)
			if(option[i] == null)
				option[i] = initOptions[i];

		//ajax定义
		var xmlhttp;
		if (window.XMLHttpRequest)
		{
			//高版本浏览器
			xmlhttp=new XMLHttpRequest();
		}
		else
		{
			//低版本IE
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}

		//状态变化时事件
		xmlhttp.onreadystatechange=function()
		{
			//执行结束
			if(xmlhttp.readyState==4){
				//返回成功
				if(xmlhttp.status==200){
					if(option.onSuccess)
						option.onSuccess(xmlhttp);
				}
				else
				{
					//返回失败
					if(option.onError)
						option.onError(xmlhttp);
				}
			}
		}

		//设置头部
		if(option.headers)
			for(var i in option.headers)
				xmlhttp.setRequestHeader(i,option.headers[i]);

		//参数生成
		var vars = [];
		var sendVar = null;
		if(option.vars)
			for(var i in option.vars)
				vars.push(i+"="+option.vars[i]);

		//POST传值
		if(option.method == "POST")
			sendVar = vars.join("&");

		//GET传值
		if(option.method == "GET")
		{
			if(/\?/.test(option.url))
				option.url += "&" + vars.join("&");
			else
				option.url += "?" + vars.join("&");
		}

		//打开方法
		xmlhttp.open("GET",option.url,option.async);
		//发送
		xmlhttp.send(sendVar);
	}



	//发送GET数据
	ajax.get = function(url,vars,cb,async){
		//参数缺省
		if(typeof vars == "function")
		{
			async = cb;
			cb = vars;
		}

		//使用参数
		var option = {
			url:url,
			vars:vars,
			method:"GET",
			onSuccess:function(res){
				if(cb)
					cb(res.responseText,false,res);
			},
			onError:function(res){
				if(cb)
					cb("",true,res);
			},
			async:async
		}

		ajax(option);
	}

	//发送POST数据
	ajax.post = function(url,vars,cb,async){
		//参数缺省
		if(typeof vars == "function")
		{
			async = cb;
			cb = vars;
		}

		//使用参数
		var option = {
			url:url,
			vars:vars,
			method:"POST",
			onSuccess:function(res){
				if(cb)
					cb(res.responseText,false,res);
			},
			onError:function(res){
				if(cb)
					cb("",true,res);
			},
			async:async
		}

		ajax(option);
	}

	lcg.ajax = ajax;
}();