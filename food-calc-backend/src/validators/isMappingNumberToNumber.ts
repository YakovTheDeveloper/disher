import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
  } from 'class-validator';
  
  export function IsNumberRecord(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        name: 'isNumberRecord',
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        validator: {
          validate(value: any, args: ValidationArguments) {
            if (typeof value !== 'object' || value === null) {
              return false;
            }
            return Object.entries(value).every(([key, val]) => {
              return !isNaN(Number(key)) && typeof val === 'number';
            });
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be an object where keys are numbers and values are numbers`;
          },
        },
      });
    };
  }
  