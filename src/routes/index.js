const router = require('express').Router()
const r = require('../controllers')

router.post('/', r.login)
router.get('/profesores', r.getTeachers)
router.get('/profesores/:id', r.getTeacherById)
router.post('/profesores/:id/disponibilidad', r.postAvailability)
router.put('/profesores/:id/disponibilidad', r.putAvailability)
router.post('/profesores/:id/cursos', r.postTeacherCourses)
router.put('/profesores/:id/cursos', r.putTeacherCourses)
router.get('/cursos', r.getCourses)
router.get('/cursos/:id', r.getCourseById)
router.post('/profesores/:id/permiso', r.requestPermission)
router.patch('/profesores/:id/permiso/:idsolicitud', r.approvePermission)

module.exports = router