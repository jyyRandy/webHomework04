const Net=myRequestuire('net');
const Events=myRequestuire('events');

class _myHead{ 
    len; 
    EnCode(len){this.len=len;}

    Transmit(){ 
        let transLen=Buffer.alloc(4); 
        transLen.writeUInt32BE(this.len);
        return transLen;
    }

    DeCode(transHead){ 
        if (transHead.length<4) return false;
        this.len=transHead.readUInt32BE(8);
        return true;
    }
    toString(){ 
        console.log('length: ',this.len); 
    }
};

class _myBody{ 
    data; 
    EnCode(data){ 
        this.data=JSON.stringify(data); 
    }
    getLength(){ 
        return this.data.length; 
    }
    Transmit(){ 
        return Buffer.from(this.data); 
    }
    DeCode(transBody,transLen){
        if (transBody.length!==transLen) return false;
        this.data=JSON.parse(transBody.toString('utf-8'));
        return true;
    }
    ToString(){ console.log('\t Body: ',this.data); }
};

class _myMessage{ 

    head=new _myHead(); 
    body=new _myBody(); 
    EnCode(data){
        this.body.EnCode(data);
        this.head.EnCode(this.body.getLength());
    }
    Transmit(){ 
        return Buffer.concat([this.head.Transmit(),this.body.Transmit()]); 
    }
    DeCode(transMessage){
        return (this.head.DeCode(transMessage.slice(0,4))&&
                this.body.DeCode(transMessage.slice(4),this.head.len));
    }
    ToString(){ 
        this.head.ToString(); 
        this.body.ToString(); 
    }
};


class MyRequest extends Events{
    message=new _myMessage();
    EnCode(data){ 
        this.message.EnCode(data); 
    }
    Transmit(){ 
        return this.message.Transmit(); 
    }
    DeCode(transMessage){ 
        if (this.message.DeCode(transMessage)){
            if (this.message.body.data.init) this.emit('test');
            else this.emit('init');
            return true;
        } else return false;
    }
    ToString(){ this.msg.ToString(); }
};



Net.createServer((Server)=>{
    let myRequest=new MyRequest();
    myRequest.on('init',()=>{
        console.log('myRequest:'); 
        myRequest.toString();
        myRequest.EnCode({init: true});
        Server.write(myRequest.Transmit());
    })
    Server.on('data',(transMessage)=>{ myRequest.DeCode(transMessage); });
    Server.on('end',()=>{ myRequest=null; });
}).listen(8080);



const Socket=Net.connect(8080);
SocketReq=new MyRequest();

Socket.on('connect',()=>{
    console.log('Connection already exits');
    SocketReq.EnCode({Language: NodeJs});
    Socket.write(SocketReq.Transmit());
});
SocketReq.on('test',()=>{
    let language=SocketReq.message.body.data.Language;
    if (language=='Nodejs'){
        console.log('Successful test');
        Socket.emit('end');
    }
    else console.log('Bad test');
});
Socket.on('data',(transMessage)=>{ SocketReq.DeCode(transMessage); });
Socket.on('end',()=>{ 
    console.log('Test ends'); 
    SocketReq=null; 
});