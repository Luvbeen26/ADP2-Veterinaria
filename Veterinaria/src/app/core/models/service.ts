export interface ServiceModel {
  id:string;
  name: string;
  description: string;
  image: string;
  route: string;
  query?: Record<string, any>;
}

export interface cardService{
  service:string,
  title:string,
  description:string
}