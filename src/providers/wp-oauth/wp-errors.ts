export class WpCredentialError implements Error{

  public name = 'WpCredentialError';

  constructor(public message:string){
    this.message = message;
  }

  toString(): string {
    return this.name + ': ' + this.message;
  }
}

/**
 * Error
 */
export class WpArgumentsError extends WpCredentialError {
  public name = 'WpArgumentsError';
}
