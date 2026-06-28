import { HttpException, HttpStatus } from '@nestjs/common';
import { Tariff } from './tariff';
import { Feature, LimitKey } from './entitlement.types';

/**
 * Машиночитаемые коды ошибок прав. UI-квест по ним показывает экран
 * «обновитесь до тарифа …», а не общую ошибку 403.
 */
export enum EntitlementErrorCode {
  FeatureNotAvailable = 'FEATURE_NOT_AVAILABLE',
  LimitExceeded = 'LIMIT_EXCEEDED',
}

/** Возможность не входит в текущий тариф. */
export class FeatureNotAvailableError extends HttpException {
  constructor(
    public readonly feature: Feature,
    public readonly currentTariff: Tariff,
    public readonly availableOn: ReadonlyArray<Tariff>,
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        code: EntitlementErrorCode.FeatureNotAvailable,
        message: `Возможность «${feature}» недоступна на тарифе «${currentTariff}».`,
        feature,
        currentTariff,
        availableOn,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/** Исчерпан числовой лимит тарифа. */
export class LimitExceededError extends HttpException {
  constructor(
    public readonly limit: LimitKey,
    public readonly currentTariff: Tariff,
    public readonly allowed: number,
    public readonly used: number,
    public readonly requested: number,
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        code: EntitlementErrorCode.LimitExceeded,
        message: `Достигнут лимит «${limit}» на тарифе «${currentTariff}»: использовано ${used} из ${allowed}, запрошено ещё ${requested}.`,
        limit,
        currentTariff,
        allowed,
        used,
        requested,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
