import { useRef } from 'react';
import api from "../../../axios";

let ForgotPassword = ()=> {


    let forgotPasswordEmail = useRef();

    let forgotPasswordSubmit = async()=> {

        let email = forgotPasswordEmail.current.value;
        let forgotPasswordResponse = await api.post(`/api/v1/forgotPassword/${email}`)
    }


    return(

        <>
        
        <div className="forgot-password-div">

            <input type="email" name="" placeholder='Enter email' id="" ref={forgotPasswordEmail} />
            <button onClick={forgotPasswordSubmit}>Next</button>
        </div>
        
        
        </>

    )



}

export default ForgotPassword;