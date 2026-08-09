import React, {
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import axios from "axios";

import "./AuthPages.css";



const Register = () => {


    const navigate = useNavigate();




    const [formData,setFormData] =
    useState({

        username:"",
        email:"",
        password:"",
        confirmPassword:""

    });





    const [error,setError] =
    useState("");



    const [success,setSuccess] =
    useState("");



    const [loading,setLoading] =
    useState(false);









    const handleChange=(e)=>{


        setFormData({

            ...formData,

            [e.target.name]:
            e.target.value


        });


    };









    const register=async(e)=>{


        e.preventDefault();


        setError("");

        setSuccess("");





        if(
            formData.password !==
            formData.confirmPassword
        ){


            setError(
                "两次密码不一致"
            );


            return;


        }








        setLoading(true);




        try{


            await axios.post(

                "http://cqiming.pythonanywhere.com/api/auth/register/",


                {

                    username:
                    formData.username,


                    email:
                    formData.email,


                    password:
                    formData.password


                },

                {

                    headers:{

                        "Content-Type":
                        "application/json"

                    }

                }

            );







            setSuccess(
                "注册成功，正在登录页面..."
            );






            setTimeout(()=>{


                navigate(

                    "/login",

                    {

                        state:{

                            registrationSuccess:true

                        }

                    }

                );


            },1000);






        }

        catch(err){



            setError(

                err.response?.data?.error ||

                "注册失败"

            );



        }

        finally{


            setLoading(false);


        }


    };









return (

<div className="windows-lockscreen">





<div className="lock-wallpaper"/>








<div className="windows-login register-box">







<div className="windows-avatar">


✦

</div>







<h2>


创建账户


</h2>









{
error &&


<div className="error-message">

{error}

</div>


}









{
success &&


<div className="success-message">

{success}

</div>


}









<form onSubmit={register}>









<input


name="username"


placeholder="用户名"


value={formData.username}


onChange={handleChange}


/>










<input


name="email"


type="email"


placeholder="邮箱"


value={formData.email}


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









<div className="password-wrapper">



<input


name="confirmPassword"


type="password"


placeholder="确认密码"


value={formData.confirmPassword}


onChange={handleChange}


/>



</div>









<button

disabled={loading}

>


{

loading

?

"注册中..."

:

"注册"

}



</button>







</form>









<p

className="switch"

onClick={()=>navigate("/login")}

>


已有账号？立即登录


</p>







</div>








</div>


);



};



export default Register;