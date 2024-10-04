import {test, expect} from '@jest/globals'
import { generateCsvContent } from '../src/lib/export/csv'

test('generate csv content', () => {
	const generatedContent = generateCsvContent(
		['date', 'dates', 'bool1', 'bool2', 'number', 'string'],
		[
			[
				new Date('2024/10/04 14:30:00'),
				[new Date('2024/10/04 14:30:00'), new Date('2024/10/03 14:30:00')],
				true,
				false,
				10,
				'will"this"break',
			],
		],
		';',
	)

	expect(generatedContent).toBe(
		'date;dates;bool1;bool2;number;string\n04/10/2024 14:30;04/10/2024 14:30;Ja;Nej;10;"will""this""break"',
	)
})
