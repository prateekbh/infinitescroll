(function(){
	//globals
	//globals end here
	var Utils={
		//CUSTOM HANDLER FOR BROWSER PREFIXES
		addAnimEventListener:function(element,type,callback){
			var pfx = ["webkit", "moz", "MS", "o", ""];
				for (var p = 0; p < pfx.length; p++) {
					if (!pfx[p]) type = type.toLowerCase();
					element.addEventListener(pfx[p]+type, callback, false);
				}
		},
		calcHeight:function(){
			var body = document.body, html = document.documentElement;
			return Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
		},
		getMsgElem:function(e){
			var curr=e;
			if(curr.className==="msg"){
				return e;
			}
			else{
				while(curr.className!=="msg"){
					curr=curr.parentNode;
				}
				if(curr.className==="msg"){
					return curr;
				}
			}
			return null;
		}
	}


	var MsgsApp={
		mainElem:null,
		mainElemHeight:0,
		pageCount:0,
		debounceTimer:null,
		scrollListener:function(e){
			var winY=window.scrollY;
			var winHeight=window.innerHeight;
			if(this.mainElemHeight-winHeight<winY+100){
				this.msgsQ.fetch(this.pageCount,this.mainElem,this.msgTemplate);
			}

			//CORE LOGIC FOR DOM RECYCLING
			var oldHeight=this.mainElem.getBoundingClientRect().height;

			//REMOVE FAR AWAY MSGS CONTENT
			for(var i=0;i<(Math.floor(winY/230)-3);i++){
				this.msgsQ.get(i)&&this.msgsQ.get(i).clean()
			}

			//SHOW ATLEAST NEXT 8 MSGS CONTENT
			for(var i=Math.floor(winY/230)-3;i<Math.ceil(winY/130)+8;i++){
				this.msgsQ.get(i)&&this.msgsQ.get(i).fill();	
			}
			var newHeight=this.mainElem.getBoundingClientRect().height;

			//READJUST HEIGHT
			window.scrollTo(0,winY-(oldHeight-newHeight));
			this.mainElemHeight=Utils.calcHeight();
		},
		animEndHandler:function(e){
			e.target.remove();
			//ALSO REMOVE LOGICAL DS FROM MEMORY
			this.msgsQ.msgs.splice(this.msgsQ.msgs.indexOf(e.target.ds),1);
			this.mainElemHeight=Utils.calcHeight();
		},
		hideMainLoader:function(){
			this.loaderElem.classList.add('hidden');
		},
		init:function(elem,loaderElem,miniLoaderElem,msgTemplate){
			var that=this;
			this.mainElem=elem;
			this.msgsQ=new MsgList(miniLoaderElem);
			this.mainElemHeight=Utils.calcHeight();
			this.loaderElem=loaderElem;
			this.miniLoaderElem=miniLoaderElem;
			this.msgTemplate=msgTemplate;

			//attach passive event listeners
			//DEBOUNCE MECHANISM TO AVOID TOO MUCH SCROLL COMPUTATIONS
			document.addEventListener("scroll",function(e){
				if(this.debounceTimer){
					clearTimeout(this.debounceTimer)
				}
				this.debounceTimer=setTimeout(function(){that.scrollListener(e)},300);
			},false);

			//animation event handler
			Utils.addAnimEventListener(elem,"animationend",function(e){
				that.animEndHandler.call(that,e);	
			});

			//fetch first set of msgs
			this.msgsQ.fetch(this.pageCount,this.mainElem,this.msgTemplate).then(()=>{
				this.hideMainLoader();
			});

			/*swipe functionality*/
			var startX=0,endX=0;
			var startY=0,endY=0;
			this.mainElem.addEventListener("touchstart",function(e){
				startX=e.touches[0].clientX;
				startY=e.touches[0].clientY;
			});
			this.mainElem.addEventListener("touchmove",function(e){
				endX=e.touches[0].clientX;
				endY=e.touches[0].clientY;
			});
			this.mainElem.addEventListener("touchend",function(e){
				if(endX-startX>100){
					var currElem=Utils.getMsgElem(e.target);
					currElem&&currElem.classList.add("swipeout");
				}
			});
		}
	}

	function MsgList(qLoader){
		this.msgs=[];
		this.qLoader=qLoader;
		this.miniLoaderShown=false;
	}

	MsgList.prototype.addMsg=function(msg){
		this.msgs.push(msg);
	}

	MsgList.prototype.get=function(i){
		return this.msgs[i];
	}

	MsgList.prototype.getLength=function(){
		return this.msgs&&this.msgs.length||0;
	}

	MsgList.prototype.toggleMiniLoader=function(){
		if(this.miniLoaderShown){
			this.qLoader.classList.add('invisible');
		} else {
			this.qLoader.classList.remove('invisible');
		}
		this.miniLoaderShown=!this.miniLoaderShown;
	}

	MsgList.prototype.fetch=function(pageCount,msgContainer,msgTemplate){
		return fetch('https://message-list.appspot.com/messages?pageToken='+pageCount++)
		.then(res=>res.json())
		.then(data=>{
			if(this.msgs.length>0){
				this.toggleMiniLoader();
			}
		  for(var i=0;i<data.count;i++){
		  	var currMsg=data.messages[i];
		  	var $msg=document.createElement("div");
		  	$msg.className="msg";
		  	var msgNode=new MsgNode($msg,msgTemplate.replace('{%imgsrc%}',"/infinitescroll"+currMsg.author.photoUrl).replace('{%name%}',currMsg.author.name).replace('{%timestamp%}',currMsg.updated).replace('{%msg%}',currMsg.content));
		  	msgContainer.appendChild($msg);
		  	this.msgs.push(msgNode);
		  }
		  if(this.msgs.length>0){
		  	this.toggleMiniLoader();
		  }
		  return new Promise(function(res,rej){
		  	res('');
		  })

		}).catch(e=>{
			console.log(e);
			alert("An error has been occoured while fetching msgs");
		});
	}

	function MsgNode(parent,content){
		this.parentRef=parent;
		this.parentRef.ds=this;
		this.content=content;
		this.parentRef.innerHTML=content;
		this.isCleaned=false; 
	}

	MsgNode.prototype.clean=function(){
		if(!this.isCleaned){
			this.parentRef.innerHTML="";
			this.isCleaned=true;
			this.parentRef.classList.add("cleaned");
		}
	}

	MsgNode.prototype.fill=function(){
		if(this.parentRef){
			this.parentRef.innerHTML=this.content;
			this.isCleaned=false;
			this.parentRef.classList.remove("cleaned");
		}
	}

	document.addEventListener("DOMContentLoaded", function(event) { 
			window.scrollTo(0,0);
			MsgsApp.init(document.querySelector('.msgs'),document.querySelector('.msgs-loading'),document.querySelector('.miniloader'),document.querySelector('#templMsg').innerHTML);
		});

})()