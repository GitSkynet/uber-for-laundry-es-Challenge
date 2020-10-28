//requerimos express y express router
const express = require("express");
const router = express.Router();

// requerimos nuestro middleware
const withAuth = require("../helpers/middleware");

// requerimos nuestro modelo User
const User = require("../models/user");

router.get("/dashboard", withAuth, async (req, res, next) => {
  // si existe req.user, quiere decir que el middleware withAuth ha devuelto el control a esta ruta y renderizamos la vista secret con los datos del user
  if (req.userID) {
    try {
      // actualizamos la variable res.locals.currentUserInfo con los datos actualizados del usuario
      const userUpdated = await User.findById({_id: req.userID});
      // ... y actualizamos nuestro 'currentUserInfo' con el usuario actualizado
      res.locals.currentUserInfo = userUpdated;
      // renderizamos nuestra vista de 'dashboard'
      res.render('laundry/dashboard')
    } catch (error) {
      next(error);
      return;
    }
  } else {
    // en caso contrario (si no hay token) redirigimos a la home
      res.redirect('/')
    // otra opción es definir la respuesta con status 401, y renderizamos nuestra vista 'home' con un errorMessage ('Unauthorized: No token provided')
  }
});


router.post("/launderers", withAuth, async (req, res, next) => {
  // declaramos userId trayendolo desde el request.userID
  const userId = req.userID
  // definimos una variable con el fee y el isLaunderer a partir del formulario
  const laundererInfo = {
    fee: req.body.fee,
    isLaunderer: true,
  };
  try {
    // hacemos una búsqueda de User por ID para modificarlo, y le pasamos la información que acabamos de definir, y lo guardamos en una variable...
    const theUser = await User.findByIdAndUpdate(userId, laundererInfo, {new: true});
    // ... y definimos a nuestro req.user como ese valor (es decir, nuestro usuario encontrado y actualizado)
    req.user = theUser;
    // redirigimos a nuestro '/dashboard' al finalizar
    res.redirect('/dashboard');
  } catch (error) {
    next(err);
    return;
  }
});

router.get("/launderers", withAuth, async (req, res, next) => {
  try {
    /* buscamos User y filtramos por aquellos que son launderers*/
    const launderersList = await User.find({isLaunderer: true})
    console.log(launderersList)
    // renderizamos nuestra vista 'launderers' con el resultado de nuestra búsqueda
      res.render('laundry/launderers', {launderers: launderersList})
  } catch (error) {
    next(err);
    return;
  }
});

module.exports = router;