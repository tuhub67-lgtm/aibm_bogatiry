import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

/**
 * Окружения запуска. От него зависит строгость проверок:
 * в production отсутствие ключей AI/каналов — это предупреждение в логах,
 * а не падение, чтобы ядро (тарифы/health) поднималось независимо от интеграций.
 */
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Схема переменных окружения. Валидируется один раз на старте приложения.
 * Секреты интеграций намеренно опциональны — модуль биллинга/тарифов
 * не должен зависеть от наличия ключей Telegram/YandexGPT и т.п.
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX = 'api';

  @IsString()
  @IsOptional()
  DATABASE_URL?: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  AI_MODE?: string;

  @IsString()
  @IsOptional()
  APP_SECRET?: string;
}

/**
 * Функция-валидатор для ConfigModule. Приводит строковые env к типам и
 * бросает осмысленную ошибку на старте, если конфигурация некорректна.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Некорректная конфигурация окружения:\n${errors
        .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('\n')}`,
    );
  }

  return validated;
}
