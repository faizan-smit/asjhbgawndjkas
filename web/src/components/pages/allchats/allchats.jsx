import { useEffect, useState, useContext } from 'react';
import './allchats.css';
import api from '../../../axios';
import { GlobalContext } from '../../../context/context';
import { Link } from 'react-router-dom';


let AllChats = ()=>{

  let { state, dispatch } = useContext(GlobalContext);
  const [myChats, setMyChats]= useState([]);




    useEffect(()=>{
    
        

        let asyncFunc = async ()=>{

            let allChatsResponse = await api.get(`/api/v1/allchat/${state.user.username}`);
            console.log("mychats: ", allChatsResponse.data.chats);
            setMyChats(allChatsResponse?.data?.chats);
            console.log("mychats actual: ", myChats);
        
        
            
        
            }
        
            asyncFunc();
       
    
    }, []);




    return (


        <>
        
        
        
        
        <div id='allchatsdiv'>

            {myChats.map((user, index)=>{

               return( <div key={index} id='peruserdiv'>
                    <Link to={`/chat/${user}`}>
                    <h4 className='person-name'>{user}</h4>
                </Link>
                    {console.log("User from div: ", user)}
                </div>)

            })}

        </div>
        
        
        
        
        
        
        </>




    )

};


export default AllChats;