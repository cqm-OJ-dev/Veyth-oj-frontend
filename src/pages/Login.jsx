import React, {
    useState,
    useEffect
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import axios from "axios";

import "./AuthPages.css";
import "../App.css";

import { setCookie } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

const Login = ({onLoginSuccess}) => {


    const location = useLocation();
    const navigate = useNavigate();

    const { currentUser } = useAuth();



    const [time,setTime] =
        useState(new Date());



    const [fadeOut,setFadeOut] =
        useState(false);



    const [loading,setLoading] =
        useState(false);



    const [error,setError] =
        useState("");



    const [registrationSuccess,setRegistrationSuccess] =
        useState(false);




    const [formData,setFormData] =
        useState({

            username:"",
            password:""

        });









    useEffect(()=>{


        const timer =
        setInterval(()=>{


            setTime(
                new Date()
            );


        },1000);



        return ()=>clearInterval(timer);


    },[]);









    useEffect(() => {
        if (currentUser) {
            navigate('/', { replace: true });
        }
    }, [currentUser, navigate]);

    useEffect(()=>{


        if(
            location.state?.registrationSuccess
        ){

            setRegistrationSuccess(true);


            window.history.replaceState(
                {},
                document.title
            );

        }


    },[
        location
    ]);











    const handleChange=(e)=>{


        setFormData({

            ...formData,

            [e.target.name]:
            e.target.value

        });


    };









    const login=async(e)=>{


        e.preventDefault();


        setError("");

        setLoading(true);



        try{


            const response =
            await axios.post(

                "https://cqiming.pythonanywhere.com/api/auth/login/",

                formData,

                {

                    headers:{

                        "Content-Type":
                        "application/json"

                    }

                }

            );






            if(onLoginSuccess){


                onLoginSuccess({

                    username:
                    formData.username,


                    token:
                    response.data.access,


                    refreshToken:
                    response.data.refresh

                });


            }







            if(response.data.access){


                setCookie(

                    "authToken",

                    response.data.access,

                    30

                );

            }







            if(response.data.refresh){


                setCookie(

                    "refreshToken",

                    response.data.refresh,

                    30

                );

            }






            setFadeOut(true);

        }

        catch(err){



            setError(

                "用户名或密码错误"

            );



        }

        finally{


            setLoading(false);


        }


    };









return (

<div

className={

"windows-lockscreen "

+

(

fadeOut

?

"windows-fade-out"

:

""

)

}

>




<div className="lock-wallpaper"/>






<div className="lock-clock">


<div>

{
time.toLocaleTimeString(

[],

{

hour:"2-digit",

minute:"2-digit"

}

)

}

</div>



<span>

{
time.toLocaleDateString(

"zh-CN",

{

weekday:"long",

year:"numeric",

month:"long",

day:"numeric"

}

)

}

</span>



</div>









<div className="windows-login">





<div className="windows-avatar">

V

</div>






<h2>

{

formData.username ||

"用户登录"

}

</h2>








{
registrationSuccess &&


<div className="success-message">

注册成功，请登录

</div>

}







{
error &&


<div className="error-message">

{error}

</div>

}









<form onSubmit={login}>





<input

name="username"

placeholder="用户名"

value={formData.username}

onChange={handleChange}

/>








<div className="password-wrapper">



<input

name="password"

type="password"

placeholder="密码"

value={formData.password}

onChange={handleChange}

/>



</div>








<button

disabled={loading}

>


{

loading

?

"登录中..."

:

"登录"

}


</button>






</form>








<p

className="switch"

onClick={() => window.location.href = '/register'}

>

没有账号？立即注册

</p>






</div>








</div>

);


};



export default Login;