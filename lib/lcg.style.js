//Style组件 样式控制器
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
	
}();