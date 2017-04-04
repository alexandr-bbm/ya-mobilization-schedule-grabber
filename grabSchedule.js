const osmosis = require('osmosis');
const jsonfile = require('jsonfile');

const schools = [
	{
		name: 'frontend',
		url: 'https://academy.yandex.ru/events/frontend/shri_msk-2016/',
	},
	{
		name: 'backend',
		url: 'https://academy.yandex.ru/events/mobdev/msk-2016/',
	},
	{
		name: 'design',
		url: 'https://academy.yandex.ru/events/design/msk-2016/',
	},
];

const grabSchedule = () => {
	schools.forEach(school => {
		grabForSchool(school.url)
			.then(data => {
				const patchedLessons = patchLessons(data, school.name);
				jsonfile.writeFile(`${__dirname}/output/${school.name}.json`, patchedLessons, {spaces: 2});
			})
	});
};

const grabForSchool = url => {
	return new Promise((resolve) => {
		const data = [];
		osmosis
			.get(url)
			.find('.hall-schedule__item')
			.then((context, osmosisData, next) => {
				const titleNode = context.querySelector('.hall-schedule__title-link');
				const teacherNodes = context.querySelectorAll('.hall-schedule__speaker a');
				const title = titleNode.textContent;
				const link = titleNode.getAttribute('href');

				let teacherInfoPromises = [];
				teacherNodes.forEach(teacherNode => {
					const teacherLink = teacherNode.getAttribute('href');
					teacherInfoPromises.push(new Promise((resolve) => {
						osmosis
							.get(teacherLink)
							.find('.person__about')
							.then((context) => {
								const teacher = {
									name: teacherNode.textContent,
									link: teacherLink,
									about: context.textContent,
								};
								resolve(teacher);
							})
					}))
				});

				Promise.all(teacherInfoPromises)
					.then((teachers) => {
						const lesson = { title, link, teachers };
						data.push(lesson);
						return next(context, osmosisData)
					})
			})
			.done(() => resolve(data));
	})
};

const patchLessons = (data, schoolName) => {
	return data.map(item => Object.assign(item, {
		title: item.title.replace(/Лекция \d+\. /, ''),
		schools: [schoolName],
	}))
};

module.exports = grabSchedule;