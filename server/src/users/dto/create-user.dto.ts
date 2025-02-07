import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(100, { message: 'Username is too long' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(255, { message: 'Password is too long' })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name is too short' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name is too short' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  isActive?: boolean;
}
