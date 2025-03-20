import { expect, test } from "@jest/globals"
import { customerService } from "../src/service/customer"

test('create new customer', async () => {
	const testFunc = async () => {
		const newCustomer = await customerService.create({
			company: "Test customer",
			email: "test@skancode.dk",
			plan: "lite",
		})

		expect(newCustomer).toBeDefined()
		expect(newCustomer.id).toBeDefined()

		const settings = await customerService.getSettings(newCustomer.id)

		expect(settings).toBeDefined()
		expect(settings.useReference).toBeTruthy()
		expect(settings.usePlacement).toBeTruthy()
		expect(settings.useBatch).toBeTruthy()

		await customerService.deleteByID(newCustomer.id)
	}

	await expect(testFunc()).resolves.not.toThrow()
})
