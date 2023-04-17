const express = require('express');
const router = express.Router();
const multer = require('multer');
const conexion = require('../models/db')
const funciones = require('../models/funciones');
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const session = require('express-session');

router.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));




const storage = multer.diskStorage({
    destination: 'public/img',
    filename: (req,file,cb)=>{
        cb(null,file.originalname)
    }
})

// Middleware
router.use(multer({
    storage,
    dest: 'public/img'
}).fields([{name: 'imagenProducto'},{name: 'imagenPreensamble'}, {name: 'stats'}]))



router.get('/productos',(req,res)=>{
    conexion.query('Select * From productos', (error,results)=>{
        if(error){
            throw error;
        }else{
            if(req.session.loggedin == true){
                res.render('productos.html',{results, name: req.session.name});
            }else{
                res.render('productos.html',{results, name: ""});
            }
            
        }
    })

    
})



router.get('/preensambles',(req,res)=>{
    conexion.query('Select * From preensambladas', (error,results)=>{
        if(error){
            throw error;
        }else{
            if(req.session.loggedin == true){
                res.render('preensambles.html',{results, name: req.session.name});
            }else{
                res.render('preensambles.html',{results, name: ""});
            }
            
        }
    })
})

router.get('/promociones',(req,res)=>{
    if(req.session.loggedin == true){
        res.render('promociones.html',{ name: req.session.name});
    }else{
        res.render('promociones.html',{ name: ""});
    }
})

router.get('/armado',(req,res)=>{
    conexion.query('Select * From productos', (error,results)=>{
        conexion.query('Select DISTINCT categoria From productos', (err,resultado)=>{
            if(error){
                throw error;
            }else{
                res.render('armado.html',{results,resultado});
            }
        })
    })
})


router.get('/administrador', async (req,res)=>{

    conexion.query('Select * From productos', (error,results,fields)=>{
        if(error){
            throw error;
        }else{
            fields[fields.length] = {name: 'Acciones'}
            res.render('administrador.html',{results,fields});
        }
    })
    
})

router.get('/editar/:id', (req,res)=>{
    const id = req.params.id;
    conexion.query('Select * from productos where idProducto = ?',[id],(error,resultado)=>{
        if(error){
            throw error;
        }else{
            res.render('editar.html',{usuario: resultado[0]});
        }
    })
})


router.get('/agregarCarritoProducto/:id', (req,res)=>{
    const id = req.params.id;
    if(req.session.name){
        conexion.query('select * from usuario where nombre = ?;',[req.session.name],(error,re)=>{
            conexion.query('select idVenta from ventas inner join usuario on ventas.idUsuario = '+ re[0].idUsuario +' where usuario.idUsuario = '+ re[0].idUsuario +';',(error,results)=>{
                conexion.query('insert into detallesVentaProducto( idProducto,idVentaProducto,cantidad,subtotal) select idProducto, '+ results[0].idVenta +' as idVentaProducto, 1 as cantidad, productos.precio * 1 as subtotal from productos inner join usuario inner join ventas where productos.idProducto= '+ id +' limit 1;',(error,resultado)=>{
                    if(error){
                        throw error;
                    }else{
                        // res.redirect('/carrito');
                    }
                })
            })
        })
    }else{
        conexion.query('insert into detallesVentaProducto( idProducto,idVentaProducto,cantidad,subtotal) select idProducto, 1 as idVentaProducto, 1 as cantidad, productos.precio * 1 as subtotal from productos inner join usuario inner join ventas where productos.idProducto= '+ id +' limit 1;',(error,resultado)=>{
            if(error){
                throw error;
            }else{
                // res.redirect('/carrito');
            }
        })
    }
})




router.get('/editar_preensamble/:id', (req,res)=>{
    const id = req.params.id;
    conexion.query('Select * from productos where idProducto = ?',[id],(error,resultado)=>{
        if(error){
            throw error;
        }else{
            res.render('editar.html',{usuario: resultado[0]});
        }
    })
})




router.get('/desactivar/:id', (req,res)=>{
    const id = req.params.id;
    conexion.query('Update productos set ? where idProducto = ?',[{estado: 0},id],(error,resultado)=>{
        if(error){
            throw error;
        }else{
            res.redirect('/busqueda');
        }
    })
})

router.get('/eliminar/:id', (req,res)=>{
    const id = req.params.id;
    conexion.query('delete  from detallesVentaProducto where idDetalleVentaProducto = ?',[id],(error,resultado)=>{
        if(error){
            throw error;
        }else{
            res.redirect('/carrito');
        }
    })
})

router.get('/activar/:id', (req,res)=>{
    const id = req.params.id;
    conexion.query('Update productos set ? where idProducto = ?',[{estado: 1},id],(error,resultado)=>{
        if(error){
            throw error;
        }else{
            res.redirect('/busqueda');
        }
    })
})

router.get('/busqueda', async (req,res)=>{
    conexion.query('Select * From productos', (error,results,fields)=>{
        if(error){
            throw error;
        }else{
            fields[fields.length] = {name: 'Acciones'}
            res.render('busqueda.html',{results,fields});
        }
    })
    
})

router.get('/ventas', async (req,res)=>{
    conexion.query('Select * From ventas', (error,results,fields)=>{
        if(error){
            throw error;
        }else{
            fields[fields.length] = {name: 'Acciones'}
            res.render('ventas.html',{results,fields});
        }
    })
    
})

router.get('/detalles/:id', (req,res)=>{
    const id = req.params.id;
    conexion.query('select detallesVentaProducto.idProducto, productos.descripcion, detallesVentaProducto.cantidad, productos.precio, detallesVentaProducto.subtotal  from detallesVentaProducto inner join productos on detallesVentaProducto.idProducto = productos.idProducto where detallesVentaProducto.idVentaProducto = ?',[id],(error,resultado,fields)=>{
        conexion.query('select detallesVentaPreensamblada.idPreensamblada, preensambladas.descripcion  from detallesVentaPreensamblada inner join preensambladas on detallesVentaPreensamblada.idPreensamblada = preensambladas.idPreensamblada where detallesVentaPreensamblada.idVentaPreensamblada = ?',[id], (error,results)=>{
            if(error){
                throw error;
            }else{
                console.log(resultado)
                fields[fields.length] = {name: 'Acciones'}
                res.render('detalles.html',{resultado,fields,results});
            }
        })
    })
})

router.post('/register', async (req, res) => {
    const nombre = req.body.nombre;
    const domicilio = req.body.domicilio;
    const telefono = req.body.telefono;
    const correo = req.body.correo;
    const contra = req.body.contra;
    
    const hashedPassword = await bcrypt.hash(contra, saltRounds);

    var today = new Date();
    var now = today.toISOString()
    conexion.query('INSERT INTO usuario set ?',{nombre: nombre, domicilio: domicilio, telefono: telefono, correo: correo, contra: hashedPassword},async (error,resultados)=>{
        conexion.query('insert into ventas set ?',{idVenta: 0, total: 0, fecha: now, tipoPago: "Tarjeta de credito", idUsuario: resultados.insertId}, async (er,result)=>{
            if(error){
                throw error;
            }else{
                res.redirect('/login')
            }

        })
    })

 });
 
 router.post('/login', async (req, res) => {
    const correo = req.body.correo;
    const contra = req.body.contra;

    conexion.query('SELECT * FROM usuario WHERE correo = ?',[correo], async (error,resultados)=>{
        if(error){
            throw error;
        }else{
             const passwordMatch = await bcrypt.compareSync(contra, resultados[0].contra);
             if (passwordMatch) {
                 req.session.loggedin = true;
	             req.session.name = resultados[0].nombre;
                 res.redirect('/inicio')
             } else {
                res.render('login.html')
             }
        }

    })


 });


router.get('/inicio',(req,res)=>{
    if(req.session.loggedin == true){
        res.render('inicio.html',{ name: req.session.name})
    }else{
        res.render('inicio.html',{ name: ""})
    }
})

router.get('/logout',(req,res)=>{
    if(req.session.loggedin == true){
        req.session.destroy();
        res.redirect('/inicio')
    }else{
        res.render('inicio.html')
    }
})


router.get('/login',(req,res)=>{
    res.render('login.html',);
})


router.get('/carrito', (req,res)=>{
    if(req.session.name){
        conexion.query('select * from usuario where nombre = ?;',[req.session.name],(error,re)=>{
            conexion.query('select idVenta from ventas inner join usuario on ventas.idUsuario = '+  re[0].idUsuario +' where usuario.idUsuario = '+ re[0].idUsuario +';',(error,results)=>{
                conexion.query('select detallesVentaProducto.idDetalleVentaProducto, productos.imagen, productos.descripcion, detallesVentaProducto.cantidad, productos.precio, detallesVentaProducto.subtotal from detallesVentaProducto inner join productos on detallesVentaProducto.idProducto = productos.idProducto where idVentaProducto = '+ results[0].idVenta +';',(error,resultado)=>{
                    if(error){
                        throw error;
                    }else{
                        if(req.session.loggedin == true){
                            res.render('carrito.html',{resultado, name: req.session.name});
                        }else{
                            res.render('carrito.html',{resultado, name: ""});
                        }
                    }
                })
            })
        })
    }else{
        conexion.query('select detallesVentaProducto.idDetalleVentaProducto, productos.imagen, productos.descripcion, detallesVentaProducto.cantidad, productos.precio, detallesVentaProducto.subtotal from detallesVentaProducto inner join productos on detallesVentaProducto.idProducto = productos.idProducto where idVentaProducto = 1;',(error,resultado)=>{
            if(error){
                throw error;
            }else{
                if(req.session.loggedin == true){
                    res.render('carrito.html',{resultado, name: req.session.name});
                }else{
                    res.render('carrito.html',{resultado, name: ""});
                }
            }
        })
    }
})

router.post('/comprar', (req,res) =>{
    var today = new Date();
    var now = today.toISOString()
    const total = req.body.total;
    const metodoPago = req.body.metodoPago;
    if(req.session.name){
        conexion.query('select * from usuario where nombre = ?;',[req.session.name],(error,re)=>{
            conexion.query('select idVenta from ventas inner join usuario on ventas.idUsuario = '+  re[0].idUsuario +' where usuario.idUsuario = '+ re[0].idUsuario +';',(error,results)=>{
                conexion.query('Update ventas set ? where idVenta = ?',[{total: total, fecha: now, tipoPago: metodoPago},results[0].idVenta],(error,resultado)=>{
                    if(error){
                        console.log(error);
                    }else{
                        setTimeout(() => {
                            res.redirect('/carrito');
                          }, 3000);
                    }
                })
            })
        })
    }else{
        res.redirect('/login')
    }
    
})









router.get('/register',(req,res)=>{
    res.render('register.html',);
})

router.get('/usuarios',(req,res)=>{
    conexion.query('Select * From usuario', (error,results,fields)=>{
        if(error){
            throw error;
        }else{
            res.render('usuarios.html',{results,fields});
        }
    })
})


router.post('/saveProducto',funciones.saveProducto)
router.post('/savePreensamble',funciones.savePreensamble)
router.post('/buscar',funciones.buscar)
router.post('/buscarUsuarios',funciones.buscarUsuarios)
router.post('/update/:id',funciones.update)


module.exports=router;
