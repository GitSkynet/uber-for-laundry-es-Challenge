const express = require("express");
const router = express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const withAuth = require("../helpers/middleware");

//bcryptjs, salt rounds y salt
const bcrypt = require("bcryptjs");
const bcryptSalt = 10;
////

router.get("/signup", (req, res, next) => {
    res.render("auth/signup", {errorMessage: ""})
});

router.post("/signup", async (req, res, next) =>{
    const {name, email, password} = req.body
    if(req.body.email === "" || req.body.password === "") {
        res.render("auth/signup", {
          errorMessage: "Indicate a username and a password to login",
        });
        return;
    }
    try {
        // Utilizamos algún método de mongoose para determinar si existe algún user con el mismo email
        const user =  await User.findOne({email: email});
        // Validamos qué sucede si existe, renderizando la vista de 'signup' y mostrando un mensaje al usuario.
        if(user !== null){
            res.render("auth/signup", {
                errorMessage: "This email already exists!!! Try other or Log in!"
            });
        }
        // En caso de que no exista, definimos un valor para salt y generamos un hash con el password mediante los métodos del paquete bcrypt
        const salt = bcrypt.genSaltSync(bcryptSalt);
        const hashPass = bcrypt.hashSync(password, salt);

        // Generamos una nueva instancia de nuestro modelo User con la información recolectada y usamos el método 'save' para guardarlo en BDD
        const userSubmission = {name: name, email: email, password: hashPass}
        const theUser = new User (userSubmission)
        theUser.save((error)=>{
            if(error){
                res.render("auth/signup", {errorMessage: "Something went wrong"})
                return;
            }
        });
          res.redirect("/")
    } catch (error) {
          next(error);
          return;
      }
    
});

router.get("/login", (req, res, next) => {
    res.render("auth/login", {errorMessage: ""})
});

router.post("/login", async (req, res) => { // <<<< ESTA RUTA
    // desestructuramos el email y el password de req.body
    const {email, password} = req.body
  
    // si alguna de estas variables no tiene un valor, renderizamos la vista de auth/login con un mensaje de error
    if (req.body.email === "" || req.body.password === "") {
      res.render("auth/login", {
        errorMessage: "Please enter both, username and password to sign up.",
      });
      return;
    }
  
    try {
      // revisamos si el usuario existe en la BD
      const user = await User.findOne({ email });
      // si el usuario no existe, renderizamos la vista de auth/login con un mensaje de error
      if (!user) {
        res.render("auth/login", {
          errorMessage: "The email doesn't exist.",
        });
        return;
      }
      // si el usuario existe, hace hash del password y lo compara con el de la BD (con el método de bcrypt de compareSync)
      else if (bcrypt.compareSync(password, user.password)) {
        // Issue token
        // buscamos nuestro usuario por 'email' y tramos toda la información salvo por el password (método select) y lo metemos en una variable.
        const userWithoutPass = await User.findOne({ email }).select("-password");
        // definimos nuestro payload	
        const payload = { userID: userWithoutPass._id };
        //console.log('payload', payload);
        // si coincide, creamos el token usando el método sign, el string de secret session y el expiring time
        const token = jwt.sign(payload, process.env.SECRET_SESSION, {
          expiresIn: "1h",
        });
        
          // enviamos en la respuesta una cookie con el token (recordar agregar el {httpOnly: true} en la respuesta) y luego redirigimos a la home
          res.cookie("token", token, { httpOnly: true });
          res.status(200).redirect("/");
      } else {
          // en caso contrario, renderizamos la vista de auth/login con un mensaje de error
          res.render("auth/login", {
            errorMessage: "Incorrect password",
        });
      }
    } catch (error) {
      console.log(error);
    }
  });

  router.get("/logout", withAuth, (req, res) => {
      // 1ro - Seteamos el token con un valor vacío y una fecha de expiración en el pasado (Jan 1st 1970 00:00:00 GMT) - Esto es una forma práctica de 'anular' el token, y por ende desloguearnos.
      res.cookie("token", "", { expires: new Date(0) });
      // 2do - Redirigimos a nuestra ruta '/'
      res.redirect("/");
    });


module.exports = router;