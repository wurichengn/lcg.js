# lcg.js
一个组件化的前端JS开发框架

# 这个框架是什么
lcg.js本身仅仅是一套组件关系构造的框架，有着和MVC不同却同样遵循逻辑视图分离以及结构化的开发体系。这套体系本身不具备多少附属功能，但是可以提供一个高效的组件开发模式。核心的体系旨在将功能分离开发并

#基本用法
##绑定组件
lcg.js框架的一切都从组件开始，它就好像是面向对象语言中的类一样，定义着各种功能并最终给予生成的对象。不过它并不直接创建一个对象，而是将这些功能绑定在一个所谓的代理上。

```javascript
lcg.bind("hello",{
  //创建代理
  proxy:function(vals){
    return document.body;
  },
  //组件初始化时执行
  init:function(vals){
    this.setName("Hello Word!");
  },
  //自定义方法
  setName:function(){
    this.innerHTML = "Hello Word!";
  }
});
```

如果我们只是将上面的代码放入HTML中什么都不会发生，因为那仅仅是定义，下面我们来使用这个组件

```javascript
lcg.create("hello");
```

加入上面的代码后`body`里的内容就变成了`Hello World!`

##执行的过程
在上面的代码中我们绑定了一个`hello`组件，这里我们定义了一个关于该组件的内容。其中`proxy`方法用于获取要绑定方法的代理对象，这里我们直接绑定到`body`上。除了`proxy`方法外的所有方法都会被`附着`到代理对象上(这里是`body`)，在所有方法里的`this`也是指的这个代理对象本身，所以我们可以直接通过`this`来操作这个代理对象。在上面的例子中，我们在组件外部同样可以通过`body.setName`来访问。

##举个栗子
上面的代码直接使用了`body`，这回我们加入一些参数。

```html
<div id="p1"></div>
<div id="p2"></div>
```

```javascript
lcg.bind("people",{
    proxy:function(vals){
        return document.querySelector(vals.query);
    },
    init:function(vals){
        this.innerHTML = "我是"+vals.name+","+vals.age+"岁";
    }
});

lcg.create("people",{query:"#p1",name:"老城哥",age:22});
lcg.create("people",{query:"#p2",name:"吴日城",age:21});
```

执行结果如下：
```
我是老城哥,22岁
我是吴日城,21岁
```

上面的代码中我们通过参数中的`query`来获取Dom对象作为代理，并在这个代理上执行了`init`方法。通过参数中的`name`和`age`来改变Dom节点的内容。

能接收初始化参数的方法只有`proxy`和`init`，如果其他方法也需要这些参数，请进行传参或使用`this`进行存储。

对象和组件之间可以任意数量的`附着`，不过并不推荐一个对象绑定多次同一个组件，除非开发的是一个一次性功能型组件。

##不仅仅局限于Dom
由于在HTML开发中绝大多数时候都在与Dom节点打交道，但是lcg.js是一个以js对象为目标的框架，所以请放心的用在任意JS对象上。

```javascript
lcg.bind("mydate",{
    //以一个新的Date对象作为组件目标
    proxy:function(){
        return new Date();
    },
    //格式化时间
    format:function(){
        return 1900+(this.getYear())+"年"+(1+this.getMonth())
            +"月"+this.getDate()+"日";
    }
});
alert(lcg.create("mydate").format());
```

上面的组件使用当前时间作为代理，为这个新建的时间对象插入了一个格式化时间的方法，通过调用这个方法来获取格式化后的时间。这样做不同于直接为`Date.prototype`中加入`format`方法，这样做不会影响所有的`Date`对象，仅仅会应用于通过`lcg.js`代理的对象。

##为已存在的对象绑定组件

如果一个对象已经被创建，可以直接通过`lcg.use`来使用组件而不需要调用`proxy`方法获取对象。

```javascript
lcg.bind("hand",{
    init:function(){
        console.log("I have a hand");
    }
});
lcg.bind("foot",{
    init:function(){
        console.log("I have a foot");
    }
});
var people = lcg.use(lcg.use({},"hand"),"foot");
```
执行结果如下
```
I have a hand
I have a foot
```

上面我们通过`lcg.use`方法为一个空对象连续附着了`hand`组件和`foot`组件，这样这个人类就拥有了这两个组件的功能。

这里`init`是一个比较特殊的方法，在每个组件被附着的时候都会被框架主动调用一次，那么其他方法在两个组件出现命名冲突的时候应该如何处理呢？

##组件命名冲突

```javascript
lcg.bind("foot-left",{
    jump:function(){
        console.log("left jump");
    }
});
lcg.bind("foot-right",{
    jump:function(){
        console.log("right jump");
    }
});
var people = lcg.use({},"foot-left");
lcg.use(people,"foot-right");
people.jump();
```
执行结果如下
```
left jump
```
在主键`附着`对象的时候，如果遇到原生的命名冲突方法将会将其覆盖，如果遇到其他组件附着过的时候就不会覆盖，而是隐藏起来。如果希望右脚跳跃的话可以使用下面的方法进行编写。

```javascript
people.jump.use("foot-right")();
```
执行结果
```
right jump
```

上面我们在使用被组件附着的方法前先对方法使用了`use`方法，强制规定了使用哪一个组件的方法，第二个括号中则填写这个方法所需要的参数即可，我们的`jump`方法留空即可。这样我们就可以通过组件名来使用对象相应组件的方法。


##消息触发
上面我们给出了可以调用指定组件指定方法的用法，那如果我们希望所有组件的指定名称方法都被调用呢？
```javascript
people.jump.message();
```
执行结果
```
left jump
right jump
```
上面我们通过在调用方法前加入一个message就可以进行消息触发，它将按照组件`附着`的顺序来执行相应的方法。值得注意的是消息触发是没有返回值的，主要用于通用事件的触发。如果说希望通过函数获取返回的话请通过对象参数作为`钩子`获取。

##组件继承

虽然组件和对象之间可以任意的通过`附着`来组合，但是也会遇到需要扩展一个已存在组件功能的情况，这个时候可以使用继承体系。

```javascript
lcg.bind("life",{
    proxy:function(vals){
        return {name:vals};
    },
    die:function(){
        console.log("life die");
    }
});
lcg.bind("people",{
    //继承自life
    extend:"life",
    //重构die方法
    die:function(){
        console.log(this.name+" die");
        this._parent("die");
    }
});
lcg.create("people","史莱姆").die();
```
执行结果
```
史莱姆 die
life die
```

我们通过`extend`属性来让组件继承自另一个组件，继承的过程中会拥有父组件中的所有方法，包括`proxy`。如果子组件与父组件拥有命名冲突方法的话子组件会覆盖父组件的方法（重构）。但是在子组件的方法中（除了`proxy`）可以直接通过`this._parent(funcName,args,...)`来调用父组件中相应的方法（调用父组件方法的功能还存在部分问题，如无法在延时方法中执行）。

组件是可以无限的继承下去，并且与其他组件共同绑定的时候不会有冲突问题。但是我们无法通过`func.use(moduleName)()`来执行一个父组件的方法，`message`也是一样，他们都仅限于直接附着于对象的组件方法。

##说明

看完说明希望您已经了解如何使用`lcg.js`框架设计属于您自己的组件，并且希望您可以享受于组件化的开发流程中。在`lcg.build.js`框架中还封装了一些其他的功能和一些预制组件(包括`ajax`、`dom-module`等)，如果您仅仅需要这套组件体系的话引入`lcg.js`即可。