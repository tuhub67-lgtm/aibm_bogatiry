import { SetMetadata } from '@nestjs/common';
import { Feature } from './entitlement.types';

/** Ключ метаданных, по которому EntitlementGuard читает требуемые возможности. */
export const REQUIRE_FEATURE_KEY = 'require_feature';

/**
 * Помечает маршрут/контроллер как требующий возможности тарифа.
 * Несколько возможностей трактуются как «нужны ВСЕ» (логическое И).
 *
 *   @RequireFeature(Feature.Analytics)
 *   @Get('overview')
 *   getOverview() { ... }
 */
export const RequireFeature = (...features: Feature[]) =>
  SetMetadata(REQUIRE_FEATURE_KEY, features);
