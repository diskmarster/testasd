import { historyTypeZodSchema } from '@/data/inventory.types'
import { analyticsService } from '@/service/analytics'
import { inventoryService } from '@/service/inventory'
import { validateRequest } from '@/service/user.utils'
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
  try {
    const start = performance.now()
    const { session, user } = await validateRequest(headers())

    if (session == null || user == null) {
      return NextResponse.json(
        {
          msg: 'Du har ikke adgang til denne resource',
        },
        {
          status: 401,
        },
      )
    }

    if (headers().get('content-type') != 'application/json') {
      return NextResponse.json(
        {
          msg: 'Request body skal være json format',
        },
        {
          status: 400,
        },
      )
    }

    const zodRes = createRegulationSchema.safeParse(await request.json())

    if (!zodRes.success) {
      return NextResponse.json(
        {
          msg: 'Indlæsning af data fejlede',
          errorMessages: zodRes.error.flatten().formErrors,
          error: zodRes.error,
        },
        {
          status: 400,
        },
      )
    }

    const { data } = zodRes

    console.log('data received:', JSON.stringify(data, null, 2))

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
              `Error creating move: Could not find or create default placement`,
            )
            return NextResponse.json(
              {
                msg: `Der skete en fejl under flytning: Kunne ikke finde eller oprette en standard placering`,
              },
              {
                status: 500,
              },
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
          return NextResponse.json(
            {
              msg: 'Kunne ikke oprette en ny placering i databasen',
            },
            {
              status: 500,
            },
          )
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
            `Error creating move: Could not find or create default placement`,
          )
          return NextResponse.json(
            {
              msg: `Der skete en fejl under flytning: Kunne ikke finde eller oprette en standard placering`,
            },
            {
              status: 500,
            },
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
              `Error creating move: Could not find or create default batch`,
            )
            return NextResponse.json(
              {
                msg: `Der skete en fejl under flytning: Kunne ikke finde eller oprette en standard batch`,
              },
              {
                status: 500,
              },
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
          return NextResponse.json(
            {
              msg: 'Kunne ikke oprette nyt batch nummer i databasen',
            },
            {
              status: 500,
            },
          )
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
            `Error creating move: Could not find or create default batch`,
          )
          return NextResponse.json(
            {
              msg: `Der skete en fejl under flytning: Kunne ikke finde eller oprette en standard batch`,
            },
            {
              status: 500,
            },
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
      return NextResponse.json(
        {
          msg: `Kunne ikke oprette en ny ${data.type}, prøv igen`,
        },
        {
          status: 500,
        },
      )
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


    return NextResponse.json(
      {
        msg: 'Success',
      },
      {
        status: 201,
      },
    )
  } catch (e) {
    console.error(
      `Error getting products for authenticated user: '${(e as Error).message}'`,
    )

    return NextResponse.json(
      {
        msg: `Der skete en fejl under reguleringen: '${(e as Error).message}'`,
      },
      {
        status: 500,
      },
    )
  }
}
