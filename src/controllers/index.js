const bcrypt = require('bcrypt')
const AppError = require('../util/Error')
const mysql      = require('mysql');
const connection = mysql.createConnection({
    host: "mydbaws.c6lwdd9lyn5d.us-east-2.rds.amazonaws.com",
    user: "root",
    password: "holamundo",
    database : 'bdcalidad'
})
connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

const ctrl = {}

ctrl.login = (req,res,next) => {
    try {
        const body = req.body
        const email = body.email
        const password = body.contrasena
        console.log(email);
        
        //bcrypt.compareSync(body.password, this.local.password);
        connection.query(`SELECT * from profesor where EMAIL="${email}"`,function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));
            if(results.length==0){
                connection.query(`SELECT * from administrador where EMAIL="${email}"`,function (error, results2, fields) {
                    if (error) return next(new AppError('DatabaseError', error.message));
                    if(results2.length==0) return next(new AppError('NotRegisteredUser',"No se ha registrado ningún usuario con el email especificado." ,404));
                    if(!bcrypt.compareSync(password, results2[0].CONTRASENA)) return next(new AppError('NotRegisteredUser',"La contraseña ingresada es incorrecta" ,404));
                    res.send({user: results2[0]})
                });
            }else{
                if(results.length==0) return next(new AppError('NotRegisteredUser',"No se ha registrado ningún usuario con el email especificado" ,404));
                if(!bcrypt.compareSync(password, results[0].CONTRASENA)) return next(new AppError('NotRegisteredUser',"La contraseña ingresada es incorrecta" ,404));
                res.send({user: results[0]})
                
            }
        });
    } catch (error) {
        next(error)
    }
}

ctrl.getTeachers = async (req,res,next) => {
    try {
        connection.query('SELECT * from profesor',function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));
            res.send(results)
        });
    }catch(err){
        next(err)
    }   
}

ctrl.getCourses = (req,res,next) => {
    try {
        connection.query('SELECT * from curso',function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));
            res.send(results)
        });
    }catch(err){
        next(err)
    } 
}

ctrl.getTeacherById = (req,res,next) => {
    try {
        const id = req.params.id;
        let profesor = {};
        //main informaation
        connection.query("select * from (profesor p  natural join categoria) where p.IDPROFESOR = "+ id,function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));
            if(results.length == 0) return next(new AppError('TeacherNotFound', "No existe ningún profesor con el id especificado.", 404));
            profesor = results[0]
            //teacher courses
            connection.query('select  IDCURSO, NOMBRECURSO from profesor_curso p natural join curso c where p.IDPROFESOR = '+id,function (error, results1, fields) {
                if (error) return next(new AppError('DatabaseError', error.message));
                profesor.cursos = results1
                //availability
                connection.query('select DIA, HORAS from  disponibilidad where IDPROFESOR = '+id+" order by DIA",function (error, results2, fields) {
                    if (error) return next(new AppError('DatabaseError', error.message));
                    profesor.disponibilidad = results2
                    connection.query('select * from permiso where IDPROFESOR ='+ id + ' order by idpermiso desc limit 1',function (error, results3, fields) {
                        if (error) return next(new AppError('DatabaseError', error.message));
                        if(results3.length == 0){
                            profesor.solicitud = null
                        }else{
                            profesor.solicitud = results3[0]
                        } 
                        res.send(profesor)
                    });
                });
            });
        });
    }catch(err){
        next(err)
    }   
}

ctrl.getCourseById = (req,res,next) => {
    try {
        const id = req.params.id;
        //course information
        let course = {}
        connection.query('SELECT * from curso where IDCURSO =' + id,function (error, results, fields) {
            if (error)  next(new AppError('DatabaseError', error.message));
            if(results.length == 0)  return next(new AppError('CourseNotFound', "No existe ningún curso con el id especificado.", 404));
            course = results[0]
            //teacher that chose the course
            connection.query('select * from profesor_curso natural join profesor where IDCURSO = ' + id,function (error, results2, fields) {
                if (error) return next(new AppError('DatabaseError', error.message));
                course.profesores = results2;
                res.send(course)
            });
        });
    }catch(err){
        next(err)
    }  
}

ctrl.postAvailability = (req,res,next) => {
    try {
        const id = req.params.id
        const body = req.body
        connection.query(`SELECT * FROM profesor where IDPROFESOR = ${id};`,function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));
            if(results.length == 0) return next(new AppError('TeacherNotFound', "No existe ningún profesor con el id especificado.", 404));
            if(Array.isArray(body.dia)){
                for (let i = 0; i < body.dia.length; i++) {
                    const day = body.dia[i];
                    const hours = body.horas[i].toString()
                    connection.query(`insert into disponibilidad (IDPROFESOR, DIA, HORAS) values (${id},${day},'${hours}')`,function (error, results, fields) {
                        if (error) return next(new AppError('DatabaseError', error.message));
                    });
                }
            }else{
                const day = body.dia;
                const hours = body.horas.toString()
                connection.query(`insert into disponibilidad (IDPROFESOR, DIA, HORAS) values (${id},${day},'${hours}')`,function (error, results, fields) {
                    if (error) return next(new AppError('DatabaseError', error.message));
                });
            }
            connection.query(`UPDATE profesor SET PERMISO=0 WHERE IDPROFESOR = ${id}`,function (error, results, fields) {
                if (error) return next(new AppError('DatabaseError', error.message));
                res.send({msg:"Disponibilidad registrada"})
            });
        });
    }catch(err){
        next(err)
    }   
}

ctrl.putAvailability = (req,res,next) => {
    const id = req.params.id
    const body = req.body
    connection.query(`SELECT * FROM profesor where IDPROFESOR = ${id};`,function (error, results, fields) {
        if (error)  next(new AppError('DatabaseError', error.message));
        if(results.length == 0)  throw new AppError('TeacherNotFound', "No existe ningún profesor con el id especificado.", 404);
        connection.query(`DELETE FROM disponibilidad WHERE IDPROFESOR = ${id}`,function (error, results, fields) {
            if (error)  next(new AppError('DatabaseError', error.message));
            if(Array.isArray(body.dia)){
                for (let i = 0; i < body.dia.length; i++) {
                    const day = body.dia[i];
                    const hours = body.horas[i].toString()
                    connection.query(`insert into disponibilidad (IDPROFESOR, DIA, HORAS) values (${id},${day},'${hours}')`,function (error, results, fields) {
                        if (error)  next(new AppError('DatabaseError', error.message));
                    });
                }
            }else{
                const day = body.dia;
                const hours = body.horas.toString()
                connection.query(`insert into disponibilidad (IDPROFESOR, DIA, HORAS) values (${id},${day},'${hours}')`,function (error, results, fields) {
                    if (error)  next(new AppError('DatabaseError', error.message));
                });
            }
            connection.query(`UPDATE profesor SET PERMISO=0 WHERE IDPROFESOR = ${id}`,function (error, results, fields) {
                if (error)  next(new AppError('DatabaseError', error.message));
                res.send({msg:"Disponibilidad editada"})
            }); 
        });
    });
}

ctrl.postTeacherCourses = (req,res,next) => {
    try {
        const id = req.params.id
        const body = req.body
        connection.query(`SELECT * FROM profesor where IDPROFESOR = ${id};`,function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));
            if(results.length == 0) return next(new AppError('TeacherNotFound', "No existe ningún profesor con el id especificado.", 404));
            let values="";
            body.curso.forEach(curso => {
                values+=`(${curso},${id}),`
            });
            connection.query(`insert into profesor_curso (IDCURSO,IDPROFESOR) values ${values.substring(0,values.length-1)}`,function (error, results, fields) {
                if (error) return next(new AppError('DatabaseError', error.message)); 
                res.send({msg:"Cursos editados"})
            });
        });
    } catch (error) {
        next(error)
    }
}

ctrl.putTeacherCourses = (req,res,next) => {
    try {
        const id = req.params.id
        const body = req.body
        connection.query(`SELECT * FROM profesor where IDPROFESOR = ${id};`,function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));
            if(results.length == 0)  return next(new AppError('TeacherNotFound', "No existe ningún profesor con el id especificado.", 404));          
            connection.query(`delete from profesor_curso where IDPROFESOR = ${id}`,function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));

            let values="";
            body.curso.forEach(curso => {
                values+=`(${curso},${id}),`
            });
            connection.query(`insert into profesor_curso (IDCURSO,IDPROFESOR) values ${values.substring(0,values.length-1)}`,function (error, results, fields) {
                if (error) return next(new AppError('DatabaseError', error.message)); 
                res.send({msg:"Cursos editados"})
            });
            
            });
        });
    } catch (error) {
        next(error)
    }
}

ctrl.requestPermission = (req,res,next) => {
    try {
        const id = req.params.id
        const body = req.body
        connection.query(`SELECT * FROM profesor where IDPROFESOR = ${id};`,function (error, results, fields) {
            if (error)  next(new AppError('DatabaseError', error.message));
            if(results.length == 0)  return next(new AppError('TeacherNotFound', "No existe ningún profesor con el id especificado.", 404));
            if(results[0].PERMISO == 1) return next(new AppError('NotAllowed', "El usuario ya tiene permiso para editar.", 400));
            connection.query('select * from permiso where IDPROFESOR ='+ id + ' and estado = "-" order by idpermiso desc limit 1',function (error, results, fields) {
                if (error)  return next(new AppError('DatabaseError', error.message));
                if(results.length == 1){
                    return next(new AppError('NotAllowed', "El usuario ya tiene una solicitud en proceso.", 400));
                }
                connection.query(`insert into permiso (IDPROFESOR, solicitud) values (${id}, "${body.solicitud}")`,function (error, results, fields) {
                    if (error) return next(new AppError('DatabaseError', error.message));
                    res.send({msg: "Solicitud enviada."})
                });
            });
        });
    } catch (error) {
        next(error)
    }
}

ctrl.approvePermission = (req,res,next) => {
    try {
        const id = req.params.id
        const body = req.body
        const idsolicitud = req.params.idsolicitud
        connection.query(`SELECT * FROM profesor where IDPROFESOR = ${id};`,function (error, results, fields) {
            if (error) return next(new AppError('DatabaseError', error.message));
            if(results.length == 0)  return next(new AppError('TeacherNotFound', "No existe ningún profesor con el id especificado.", 404));
            connection.query(`SELECT * FROM permiso where idpermiso = ${idsolicitud}`,function (error, results2, fields){
                if (error) return next(new AppError('DatabaseError', error.message));
                if(results2.length == 0)  return next(new AppError('PermissionNotFound', "No existe ningún permiso con el id especificado.", 404));
                if(results2[0].estado !="-")  return next(new AppError('NotAllowed', "La solicitud ya ha sido evaluada.", 404));
                switch (body.estado) {
                    case "APROBADO":
                        connection.query(`update permiso set estado="APROBADO" where idpermiso=${idsolicitud}`,function (error, results3, fields) {
                            if (error) return next(new AppError('DatabaseError', error.message));
                            connection.query(`update profesor set PERMISO=1 where IDPROFESOR=${id}`,function (error, results, fields) {
                                if (error) return next(new AppError('DatabaseError', error.message));
                            })
                            res.send({msg: "Solicitud aprobada."})
                        });
                        break;
                    case "RECHAZADO":
                        connection.query(`update permiso set estado="RECHAZADO", motivo=${body.motivo} where idpermiso=${idsolicitud}`,function (error, results3, fields) {
                            if (error) return next(new AppError('DatabaseError', error.message));
                            res.send({msg: "Solicitud rechazada."})
                        });
                        break;
                    default:
                        throw new AppError('StatusNotAllowed', "Ingrese un estado valido.", 404)
                }
            })
        });
    } catch (error) {
        next(error)
    }
}
 
module.exports = ctrl;