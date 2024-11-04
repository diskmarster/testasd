import { serverTranslation } from '@/app/i18n'
import { historyTypeZodSchema } from '@/data/inventory.types'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { inventoryService } from '@/service/inventory'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createRegulationSchema = z.object({
  locationId: z.string(),
  productId: z.coerce.number(),
  placementId: z.string().or(z.coerce.number()).nullable(),
  batchId: z.string().or(z.coerce.number()).nullable(),
  type: historyTypeZodSchema,
  quantity: z.coerce.number(),
  reference: z.string().nullable(),
})

export async function POST(
  request: NextRequest,
): Promise<NextResponse<unknown>> {
  const start = performance.now()
  const { session, user } = await validateRequest(headers())
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common')

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: t('route-translations-regulations.no-access-to-resource') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations-regulations.no-app-access') },
      { status: 401 },
    )
  }

  let json: any

  try {
    if (headers().get('content-type') != 'application/json') {
      const msg = t('route-translations-regulations.request-body-json')

      const errorLog: NewApplicationError = {
        userID: user.id,
        customerID: user.customerID,
        type: 'endpoint',
        input: json,
        error: msg,
        origin: 'POST /api/v1/regulations',
      }
      errorsService.create(errorLog)

      return NextResponse.json({ msg: msg }, { status: 400 })
    }

    json = await request.json()

    const zodRes = createRegulationSchema.safeParse(json)

    if (!zodRes.success) {
      const msg = t('route-translations-regulations.loading-failed')

      const errorLog: NewApplicationError = {
        userID: user.id,
        customerID: user.customerID,
        type: 'endpoint',
        input: json,
        error: msg,
        origin: 'POST /api/v1/regulations',
      }
      errorsService.create(errorLog)

      return NextResponse.json(
        {
          msg: msg,
          errorMessages: zodRes.error.flatten().formErrors,
          error: zodRes.error,
        },
        { status: 400 },
      )
    }

    const { data } = zodRes

    let placementId: number
    if (typeof data.placementId == 'string') {
      // Create new placement or fetch default for location
      if (data.placementId == '') {
        // fetch default
        const placements = await inventoryService.getActivePlacementsByID(
          data.locationId,
        )
        let defaultPlacement = placements.find(p => p.name == '-')
        if (defaultPlacement == undefined) {
          defaultPlacement = await inventoryService.createPlacement({
            locationID: data.locationId,
            name: '-',
          })

          if (defaultPlacement == undefined) {
            console.error(
              `${t('route-translations-regulations.error-creating-move-placement')}`,
            )

            const msg = t(
              'route-translations-regulations.error-while-moving-placement',
            )

            const errorLog: NewApplicationError = {
              userID: user.id,
              customerID: user.customerID,
              type: 'endpoint',
              input: data,
              error: msg,
              origin: 'POST /api/v1/regulations',
            }
            errorsService.create(errorLog)

            return NextResponse.json(
              {
                msg: msg,
              },
              { status: 500 },
            )
          }
        }
        placementId = defaultPlacement.id
      } else {
        const res = await inventoryService.createPlacement({
          locationID: data.locationId,
          name: data.placementId,
        })
        if (res == undefined) {
          const msg = t(
            'route-translations-regulations.error-creating-placement-db',
          )

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: data,
            error: msg,
            origin: 'POST /api/v1/regulations',
          }
          errorsService.create(errorLog)

          return NextResponse.json({ msg: msg }, { status: 500 })
        }
        placementId = res.id
      }
    } else if (typeof data.placementId == 'number') {
      placementId = data.placementId
    } else {
      // data.placementId should be undefined
      // Then fetch default placement for location
      const placements = await inventoryService.getActivePlacementsByID(
        data.locationId,
      )
      let defaultPlacement = placements.find(p => p.name == '-')
      if (defaultPlacement == undefined) {
        defaultPlacement = await inventoryService.createPlacement({
          locationID: data.locationId,
          name: '-',
        })

        if (defaultPlacement == undefined) {
          console.error(
            `${t('route-translations-regulations.error-creating-move-placement')}`,
          )
          const msg = t(
            'route-translations-regulations.error-while-moving-placement',
          )

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: data,
            error: msg,
            origin: 'POST /api/v1/regulations',
          }
          errorsService.create(errorLog)

          return NextResponse.json(
            {
              msg: msg,
            },
            { status: 500 },
          )
        }
      }
      placementId = defaultPlacement.id
    }

    let batchId: number
    if (typeof data.batchId == 'string') {
      // Create new placement or fetch default for location
      if (data.batchId == '') {
        // fetch default
        const batches = await inventoryService.getActiveBatchesByID(
          data.locationId,
        )
        let defaultBatch = batches.find(b => b.batch == '-')
        if (defaultBatch == undefined) {
          defaultBatch = await inventoryService.createBatch({
            locationID: data.locationId,
            batch: '-',
          })

          if (defaultBatch == undefined) {
            console.error(
              `${t('route-translations-regulations.error-creating-move-batch')}`,
            )
            const msg = t(
              'route-translations-regulations.error-while-moving-batch',
            )

            const errorLog: NewApplicationError = {
              userID: user.id,
              customerID: user.customerID,
              type: 'endpoint',
              input: data,
              error: msg,
              origin: 'POST /api/v1/regulations',
            }
            errorsService.create(errorLog)

            return NextResponse.json({ msg: msg }, { status: 500 })
          }
        }
        batchId = defaultBatch.id
      } else {
        const res = await inventoryService.createBatch({
          locationID: data.locationId,
          batch: data.batchId,
        })
        if (res == undefined) {
          const msg = t(
            'route-translations-regulations.error-creating-batch-db',
          )

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: data,
            error: msg,
            origin: 'POST /api/v1/regulations',
          }
          errorsService.create(errorLog)

          return NextResponse.json({ msg: msg }, { status: 500 })
        }
        batchId = res.id
      }
    } else if (typeof data.batchId == 'number') {
      batchId = data.batchId
    } else {
      // data.batchId should be undefined
      // Then fetch default placement for location
      const batches = await inventoryService.getActiveBatchesByID(
        data.locationId,
      )
      let defaultBatch = batches.find(b => b.batch == '-')
      if (defaultBatch == undefined) {
        defaultBatch = await inventoryService.createBatch({
          locationID: data.locationId,
          batch: '-',
        })

        if (defaultBatch == undefined) {
          console.error(
            `${t('route-translations-regulations.error-creating-move-batch')}`,
          )
          const msg = t(
            'route-translations-regulations.error-while-moving-batch',
          )

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: data,
            error: msg,
            origin: 'POST /api/v1/regulations',
          }
          errorsService.create(errorLog)

          return NextResponse.json(
            {
              msg: msg,
            },
            { status: 500 },
          )
        }
      }
      batchId = defaultBatch.id
    }

    if (
      !(await inventoryService.upsertInventory(
        'app',
        user.customerID,
        user.id,
        data.locationId,
        data.productId,
        placementId,
        batchId,
        data.type,
        data.quantity,
        data.reference ?? '',
      ))
    ) {
      const msg = `${t('route-translations-regulations.error-creating-new')} ${data.type}, ${t('route-translations-regulations.try-again')}`

      const errorLog: NewApplicationError = {
        userID: user.id,
        customerID: user.customerID,
        type: 'endpoint',
        input: data,
        error: msg,
        origin: 'POST /api/v1/regulations',
      }
      errorsService.create(errorLog)

      return NextResponse.json({ msg: msg }, { status: 500 })
    }

    const end = performance.now()

    await analyticsService.createAnalytic('action', {
      actionName: 'regulateInventory',
      userID: user.id,
      customerID: user.customerID,
      sessionID: session.id,
      executionTimeMS: end - start,
      platform: 'app',
    })

    return NextResponse.json({ msg: 'Success' }, { status: 201 })
  } catch (e) {
    console.error(
      `${t('route-translations-regulations.error-getting-product')} '${(e as Error).message}'`,
    )
    const msg = `${t('route-translations-regulations.error-during-regulation')} '${(e as Error).message}'`

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: json,
      error: msg,
      origin: 'POST /api/v1/regulations',
    }
    errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: msg,
      },
      { status: 500 },
    )
  }
}
