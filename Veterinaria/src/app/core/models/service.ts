export interface ServiceModel {
  id:string;
  name: string;
  description: string;
  image: string;
  route: string;
  query?: Record<string, any>;
}
