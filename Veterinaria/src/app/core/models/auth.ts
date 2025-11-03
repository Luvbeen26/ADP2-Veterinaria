export interface Token{
    access_token:string
}

export interface register{
    user:string,
    nombres:string,
    apellidos:string,
    correo:string,
    contra:string
    confirm:string
    rol:string
}

export interface login{
    usuario_mail:string,
    contra:string
}


export interface UserData{
    id:number,
    usuario:string,
    correo:string,
    rol:string,
    nombre:string
    exp:number
}