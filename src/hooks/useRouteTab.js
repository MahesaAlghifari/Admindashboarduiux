import {useLocation,useNavigate} from "react-router-dom";

export function useRouteTab(items,defaultId,param="tab"){
  const location=useLocation(),navigate=useNavigate(),ids=items.map(item=>typeof item==="string"?item:item?.id).filter(Boolean),params=new URLSearchParams(location.search),requested=params.get(param),activeId=ids.includes(requested)?requested:defaultId;
  const setActiveId=id=>{if(!ids.includes(id)||id===activeId)return;const next=new URLSearchParams(location.search);next.set(param,id);navigate({pathname:location.pathname,search:`?${next.toString()}`,hash:location.hash},{replace:true});};
  return [activeId,setActiveId];
}
