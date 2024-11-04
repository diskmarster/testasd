import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { inventoryService } from '@/service/inventory'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createMoveSchema = z.object({
  locationId: z.string(),
  productId: z.coerce.number(),
  fromPlacementId: z.string().or(z.coerce.number()).nullable(),
  toPlacementId: z.string().or(z.coerce.number()).nullable(),
  batchId: z.string().or(z.coerce.number()).nullable(),
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
      { msg: t('route-translations-move.no-access-to-resource') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations-move.no-app-access') },
      { status: 401 },
    )
  }

  const json = await request.json()

  try {
    if (headers().get('content-type') != 'application/json') {
      const msg = t('route-translations-move.request-body-json')

      const errorLog: NewApplicationError = {
        userID: user.id,
        customerID: user.customerID,
        type: 'endpoint',
        input: json,
        error: msg,
        origin: 'POST /api/v1/regulations/move',
      }
      errorsService.create(errorLog)

      return NextResponse.json({ msg: msg }, { status: 400 })
    }

    const zodRes = createMoveSchema.safeParse(json)

    if (!zodRes.success) {
      const msg = t('route-translations-move.loading-failed')

      const errorLog: NewApplicationError = {
        userID: user.id,
        customerID: user.customerID,
        type: 'endpoint',
        input: json,
        error: msg,
        origin: 'POST /api/v1/regulations/move',
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

    console.log('data received:', JSON.stringify(data, null, 2))

    let fromPlacementId: number
    if (typeof data.fromPlacementId == 'string') {
      // Create new placement or fetch default for location
      if (data.fromPlacementId == '') {
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
              `${t('route-translations-move.error-creating-move-placement')}`,
            )

            const msg = `${t('route-translations-move.error-while-moving-placement')}`

            const errorLog: NewApplicationError = {
              userID: user.id,
              customerID: user.customerID,
              type: 'endpoint',
              input: json,
              error: msg,
              origin: 'POST /api/v1/regulations/move',
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
        fromPlacementId = defaultPlacement.id
      } else {
        const res = await inventoryService.createPlacement({
          locationID: data.locationId,
          name: data.fromPlacementId,
        })
        if (res == undefined) {
          const msg = t('route-translations-move.error-creating-placement-db')

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: json,
            error: msg,
            origin: 'POST /api/v1/regulations/move',
          }
          errorsService.create(errorLog)

          return NextResponse.json({ msg: msg }, { status: 500 })
        }
        fromPlacementId = res.id
      }
    } else if (typeof data.fromPlacementId == 'number') {
      fromPlacementId = data.fromPlacementId
    } else {
      // data.fromPlacementId should be undefined
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
            `${t('route-translations-move.error-creating-move-placement')}`,
          )
          const msg = `${t('route-translations-move.error-while-moving-placement')}`

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: json,
            error: msg,
            origin: 'POST /api/v1/regulations/move',
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
      fromPlacementId = defaultPlacement.id
    }

    let toPlacementId: number
    if (typeof data.toPlacementId == 'string') {
      // Create new placement or fetch default for location
      if (data.toPlacementId == '') {
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
              `${t('route-translations-move.error-creating-move-placement')}`,
            )
            const msg = `${t('route-translations-move.error-while-moving-placement')}`

            const errorLog: NewApplicationError = {
              userID: user.id,
              customerID: user.customerID,
              type: 'endpoint',
              input: json,
              error: msg,
              origin: 'POST /api/v1/regulations/move',
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
        toPlacementId = defaultPlacement.id
      } else {
        const res = await inventoryService.createPlacement({
          locationID: data.locationId,
          name: data.toPlacementId,
        })
        if (res == undefined) {
          const msg = t('route-translations-move.error-creating-placement-db')

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: json,
            error: msg,
            origin: 'POST /api/v1/regulations/move',
          }
          errorsService.create(errorLog)

          return NextResponse.json({ msg: msg }, { status: 500 })
        }
        toPlacementId = res.id
      }
    } else if (typeof data.toPlacementId == 'number') {
      toPlacementId = data.toPlacementId
    } else {
      // data.toPlacementId should be undefined
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
            `${t('route-translations-move.error-creating-move-placement')}`,
          )
          const msg = `${t('route-translations-move.error-while-moving-placement')}`

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: json,
            error: msg,
            origin: 'POST /api/v1/regulations/move',
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
      toPlacementId = defaultPlacement.id
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
              `${t('route-translations-move.error-creating-move-batch')}`,
            )
            const msg = `${t('route-translations-move.error-while-moving-batch')}`

            const errorLog: NewApplicationError = {
              userID: user.id,
              customerID: user.customerID,
              type: 'endpoint',
              input: json,
              error: msg,
              origin: 'POST /api/v1/regulations/move',
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
      } else {
        const res = await inventoryService.createBatch({
          locationID: data.locationId,
          batch: data.batchId,
        })
        if (res == undefined) {
          const msg = t('route-translations-move.error-creating-batch-db')

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: json,
            error: msg,
            origin: 'POST /api/v1/regulations/move',
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
            `${t('route-translations-move.error-creating-move-batch')}`,
          )
          const msg = `${t('route-translations-move.error-while-moving-batch')}`

          const errorLog: NewApplicationError = {
            userID: user.id,
            customerID: user.customerID,
            type: 'endpoint',
            input: json,
            error: msg,
            origin: 'POST /api/v1/regulations/move',
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

    const fromInventoryExists =
      (await inventoryService.getInventoryByIDs(
        data.productId,
        fromPlacementId,
        batchId,
      )) != undefined

    if (!fromInventoryExists) {
      await inventoryService.createInventory(
        user.customerID,
        data.productId,
        data.locationId,
        fromPlacementId,
        batchId,
      )
    }

    await inventoryService.moveInventory(
      'app',
      user.customerID,
      user.id,
      data.locationId,
      data.productId,
      fromPlacementId,
      batchId,
      toPlacementId,
      'flyt',
      data.quantity,
      data.reference ?? '',
    )

    const end = performance.now()

    await analyticsService.createAnalytic('action', {
      actionName: 'moveInventory',
      userID: user.id,
      customerID: user.customerID,
      sessionID: session.id,
      executionTimeMS: end - start,
      platform: 'app',
    })

    return NextResponse.json({ msg: 'Success' }, { status: 201 })
  } catch (e) {
    console.error(
      `${t('route-translations-move.error-creating-move')} '${(e as Error).message}'`,
    )
    const msg = `${t('route-translations-move.error-while-moving')} '${(e as Error).message}'`

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: json,
      error: msg,
      origin: 'POST /api/v1/regulations/move',
    }
    errorsService.create(errorLog)

    return NextResponse.json({ msg: msg }, { status: 500 })
  }
}
