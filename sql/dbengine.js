var fs = require('fs');
var _sql = require("./sqllib");
var io = require('socket.io')();

var msql;
var tsql;

var LicKullanici = 0;
var LicMenu = "";

function dbengine(config)
{    
    this.config = config;
    io.listen(8091);
}
io.on('connection', function(socket) 
{     
    //console.log(io.engine.clientsCount);
    // if(Object.keys(io.sockets.connected).length > LicKullanici)
    // {
    //     socket.emit('MaxUserCounted');
    // }
    // else
    // {
    //     socket.emit('MaxUserCounted',LicMenu);
    // }

    socket.on('GetMenu',function(pParam,pFn)
    {
        if(Object.keys(io.sockets.connected).length > LicKullanici)
        {
            pFn('');
        }
        else
        {
            pFn(LicMenu);
        }
    });
    socket.on('TryConnection', function(name,fn)
    {
        msql = new _sql(config.server, '',config.uid,config.pwd,config.trustedConnection);
        msql.TryConnection(function(status)
        {
            if(status == true)
                fn(true);
            else
                fn(false);
        });
    });
    socket.on('QMikroDb',function(pQuery,fn) 
    {   
        try
        {
            msql = new _sql(config.server,config.database,config.uid,config.pwd,config.trustedConnection);
            msql.QueryPromise(pQuery,function(data)
            {
                let obj = JSON.parse(data);
                socket.emit('RMikroDb',
                {
                    tag : pQuery.tag, 
                    result : obj
                });                  
                fn({tag : pQuery.tag,result : obj});
            });
        }
        catch(err)
        {
            var tmperr = { err : 'Error dbengine.js QMikroDb errCode : 107 - ' + err} 
            socket.emit('RMikroDb',
            {
                tag : pQuery.tag, 
                result : tmperr
            });  

            fn({tag : pQuery.tag,result : tmperr});
            console.log(tmperr);
        }
    });
    socket.on("QSMikroDb",function(pQuery,fn)
    {
        try
        {
            msql = new _sql(config.server,config.database,config.uid,config.pwd,config.trustedConnection);
            msql.QueryStream(pQuery,function(data)
            {
                var obj = JSON.parse(data);

                if(obj.tagdata == "row")
                {
                    Tmp.push(obj.result);
                    
                    if(Tmp.length == 5000)
                    {
                        console.log(Tmp.length);
                        socket.emit('RSMikroDb',
                        {
                            tag : obj.tagdata, 
                            result : Tmp
                        }); 
                    }
                }

                if(obj.tagdata == "done")
                {
                    socket.emit('RSMikroDb',
                    {
                        tag : obj.tagdata, 
                        result : Tmp,
                    });  
                }
                
            });

            
        }
        catch(err)
        {
            var tmperr = { err : 'Error dbengine.js QSMikroDb errCode : 108 - ' + err} 
            socket.emit('RSMikroDb',
            {
                tag : pQuery.tag, 
                result : tmperr
            });  
        }
    });
    socket.on('QToneDb',function(pQuery) 
    {   
        try
        {
            tsql = new _sql(config.server,config.tonedb,config.uid,config.pwd,config.trustedConnection);
            tsql.QueryPromise(pQuery,function(data)
            {
                var obj = JSON.parse(data);
                socket.emit('RToneDb',
                {
                    tag : pQuery.tag, 
                    result : obj
                });   
            });
        }
        catch(err)
        {
            var tmperr = { err : 'Error dbengine.js QToneDb errCode : 107 - ' + err} 
            socket.emit('RToneDb',
            {
                tag : pQuery.tag, 
                result : tmperr
            });  
            console.log(tmperr);
        }
    });
    socket.on("QSToneDb",function(pQuery)
    {
        try
        {
            tsql = new _sql(config.server,config.tonedb,config.uid,config.pwd,config.trustedConnection);
            tsql.QueryStream(pQuery,function(data)
            {
                var obj = JSON.parse(data);
                socket.emit('RSToneDb',
                {
                    tag : pQuery.tag, 
                    result : obj
                });   
            });
        }
        catch(err)
        {
            var tmperr = { err : 'Error dbengine.js QSToneDb errCode : 108 - ' + err} 
            socket.emit('RSToneDb',
            {
                tag : pQuery.tag, 
                result : tmperr
            });  
            console.log(tmperr);
        }
    });
    socket.on("ParamSave",function(pParam,fn)
    {
        let FilePath = "";
        if(typeof process.env.APP_DIR_PATH != 'undefined')
        {
            FilePath = process.env.APP_DIR_PATH + "/.";
        }
        
        fs.writeFile(FilePath + pParam[1],'var Param = ' + JSON.stringify(pParam[0], null, '\t'),function(err)
        {
            if(typeof(err) != "undefined")
                fn(true);
            else
                fn(false);
        });
    });
    socket.on("ConfigSave",function(pParam,fn)
    {
        let FilePath = "./config.json";
        if(typeof process.env.APP_DIR_PATH != 'undefined')
        {
            console.log(1);
            FilePath = process.env.APP_DIR_PATH + "/../config.json";
        }
        
        fs.writeFile(FilePath,JSON.stringify(pParam, null, '\t'),function(err)
        {
            if(typeof(err) != "undefined")
                fn(true);
            else
                fn(false);
        });
    });
    socket.on("ConfigRead",function(pParam,fn)
    {
        fn(config);
    });
});

module.exports = dbengine;