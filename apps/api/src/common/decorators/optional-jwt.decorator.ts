import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_JWT_KEY = 'isOptionalJwt';
export const OptionalJwt = () => SetMetadata(IS_OPTIONAL_JWT_KEY, true);
