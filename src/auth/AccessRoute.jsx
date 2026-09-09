import {useEffect,useState} from "react";
import {Navigate,useLocation} from "react-router-dom";
import {useAuth} from "./useAuth";
import {canAccess,subscribeAccessControl} from "./accessControl";

export default function AccessRoute({feature,children}){
  const {user}=useAuth(),location=useLocation();
  const [,setVersion]=useState(0);
  useEffect(()=>subscribeAccessControl(()=>setVersion(value=>value+1)),[]);
  if(!canAccess(user,feature))return <Navigate to="/akses-ditolak" replace state={{from:location.pathname}}/>;
  return children;
}
