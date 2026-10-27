export interface Token{
    access_token:string
}

export interface TwoFactorChallenge {
    requires_2fa: true;
    mfa_token: string;
    message?: string;
}

export type LoginResponse = Token | TwoFactorChallenge;

export interface register{
    user?:string,
    usuario?:string,
    nombres:string,
    apellidos:string,
    correo:string,
    contra:string
    confirm:string
    rol?:string
}

export interface login{
    usuario_mail:string,
    contra:string
}

export interface UserOut {
  usuario: string;
  nombre: string;
  apellidos: string;
  correo: string;
}


export interface UserData{
    id:number,
    usuario:string,
    correo:string,
    rol:string,
    nombre:string,
    apellidos?:string,
    telefono?:string,
    twofa_habilitado?:boolean,
    exp:number
}

export interface TwoFactorConfigResponse {
    qr_code:string,
    success?:boolean,
    message?:string
}

export interface Entercode{
    email:string,
    code:string
}

export interface ChangePassword{
    email:string
    contra:string
}
