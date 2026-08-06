import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { isPropertyOnline } from "../../shared/utils/availability";
import { tenantRepository } from "./repository";
import type { CreateTenantDto, UpdateTenantDto, UpdatePropertyDto, WidgetPropertyConfigDto } from "@parrot/sdk";
import { AuthRepository } from "../auth/repository";
import { Session, User } from "@parrot/db/src/schema";
import { env } from "../../shared/env";

export class TenantController {
  static async create(req: RequestComponents): Promise<HandlerResult> {
    const { user, session } = req.meta as { user: User; session: Session };
    const userId = user.id
    if (!userId) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    const data = req.body as CreateTenantDto;

    try {
      const { tenant, defaultProperty } = await tenantRepository.createTenantWithOwner(userId, data);

      void AuthRepository.updateActiveSession(session.id, tenant.id);
      return {
        status: 201,
        message: "Tenant created successfully",
        data: {
          ...tenant,
          role: "Owner",
          defaultPropertyId: defaultProperty.id,
        },
      };
    } catch (error) {
      appError("Failed to create tenant", ERROR_CODE.APPERR, {
        context: { error },
      });
    }
  }

  static async get(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.params.tenantId;
    const userId = req.meta.user?.id;

    if (!userId) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    // Optional: check if user is member of this tenant, or if they have permission to view it
    const isMember = await tenantRepository.isUserMemberOfTenant(
      userId,
      tenantId,
    );
    if (!isMember) {
      appError("Forbidden", ERROR_CODE.PERMERR, { code: "SL09" });
    }

    const tenant = await tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      appError("Tenant not found", ERROR_CODE.NOTFOUND, { code: "SL10" });
    }

    return {
      status: 200,
      data: tenant,
    };
  }

  static async update(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.params.tenantId;
    const userId = req.meta.user?.id;
    const data = req.body as UpdateTenantDto;

    if (!userId) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    const isMember = await tenantRepository.isUserMemberOfTenant(
      userId,
      tenantId,
    );
    if (!isMember) {
      appError("Forbidden", ERROR_CODE.PERMERR, { code: "SL09" });
    }

    const tenant = await tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      appError("Tenant not found", ERROR_CODE.NOTFOUND, { code: "SL10" });
    }

    const updatedTenant = await tenantRepository.updateTenant(tenantId, data);

    return {
      status: 200,
      message: "Tenant updated successfully",
      data: updatedTenant,
    };
  }

  static async updateProperty(req: RequestComponents): Promise<HandlerResult> {
    const propertyId = req.params.propertyId;
    const userId = req.meta.user?.id;
    const data = req.body as UpdatePropertyDto;

    if (!userId) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    //TODO: Ideally check if user has permission to update this property
    const updatedProperty = await tenantRepository.updateProperty(propertyId, data);

    if (!updatedProperty) {
      appError("Property not found", ERROR_CODE.NOTFOUND, { code: "SL11" });
    }

    return {
      status: 200,
      message: "Property updated successfully",
      data: updatedProperty,
    };
  }

  static async getProperties(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.params.tenantId;
    const userId = req.meta.user?.id;

    if (!userId) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    const isMember = await tenantRepository.isUserMemberOfTenant(
      userId,
      tenantId,
    );
    if (!isMember) {
      appError("Forbidden", ERROR_CODE.PERMERR, { code: "SL09" });
    }

    const properties = await tenantRepository.getPropertiesByTenantId(tenantId);

    const propertiesWithSnippet = properties.map((property) => {
      const widgetUrl = env.FRONTEND_URL;
      const installationSnippet = `<script \n  src="${widgetUrl}/widget.js" \n  data-property-id="${property.id}">\n</script>`;
      return {
        ...property,
        installationSnippet,
      };
    });

    return {
      status: 200,
      data: propertiesWithSnippet,
    };
  }

  static async getWidgetConfig(req: RequestComponents): Promise<HandlerResult> {
    const propertyId = req.params.propertyId;
    if (!propertyId) {
      appError("Property ID is required", ERROR_CODE.INVLDDATA, { code: "SL01" });
    }

    const data = await tenantRepository.getWidgetPropertyConfig(propertyId);
    if (!data) {
      appError("Property not found", ERROR_CODE.NOTFOUND, { code: "SL04" });
    }

    const { property, hours, exceptions } = data;
    const isOnline = isPropertyOnline(property.timezone, hours, exceptions);

    const config: WidgetPropertyConfigDto = {
      name: property.name,
      brandColor: property.brandColor,
      logoUrl: property.logoUrl,
      settings: property.settings as Record<string,any>,
      isOnline,
    };

    return { status: 200, data: config };
  }
}
