const { faker } = require("@faker-js/faker");
const { join } = require("node:path");
const { readFileSync } = require("node:fs");
const { recreateDatabase } = require("../config/database");

recreateDatabase();

const UserModel = require("../models/user.model");
const ReportModel = require("../models/report.model");
const LostItemModel = require("../models/lost-item.model");
const NoteModel = require("../models/note.model");
const PersonalDetailsModel = require("../models/personal-details.model");
const AlertModel = require("../models/alert.model");

const failures = {
  [UserModel.table]: 0,
  [ReportModel.table]: 0,
  [LostItemModel.table]: 0,
  [NoteModel.table]: 0,
  [PersonalDetailsModel.table]: 0,
  [AlertModel.table]: 0,
};

async function trySave(model, arr, MODEL = null) {
  try {
    await model.save();
    arr.push(model);
  } catch {
    if (MODEL) {
      failures[MODEL.table]++;
    }
  }
}

async function createUsers(createUsersCount = 500) {
  console.info("Creating Users");
  const users = [];
  const usernamePasswordPairs = [];
  const usedUsernames = [];

  for (let i = 0; i < createUsersCount; i++) {
    let username = faker.internet.username();
    while (usedUsernames.includes(username)) {
      username = faker.internet.username();
    }
    usedUsernames.push(username);
    const user = new UserModel(
      username,
      faker.internet.email(),
      faker.internet.password(),
      faker.person.firstName(),
      faker.person.lastName(),
      0,
    );

    usernamePasswordPairs.push({
      username: user.username,
      password: user.password,
    });

    await trySave(user, users, UserModel);
  }
  console.log(
    "------------------------------USERS------------------------------",
  );
  console.table(usernamePasswordPairs);
  return users;
}

async function createOfficers(createOfficersCount = 10) {
  console.info("Creating Officers");
  const officers = [];
  const usernamePasswordPairs = [];

  for (let i = 0; i < createOfficersCount; i++) {
    const officer = new UserModel(
      `OF-${faker.helpers.rangeToNumber({ min: 100, max: 999 })}`,
      faker.internet.email(),
      faker.internet.password(),
      faker.person.firstName(),
      faker.person.lastName(),
      1,
    );

    usernamePasswordPairs.push({
      username: officer.username,
      password: officer.password,
    });

    await trySave(officer, officers, UserModel);
  }
  console.log(
    "------------------------------OFFICERS------------------------------",
  );
  console.table(usernamePasswordPairs);
  return officers;
}

async function createReports(createReportsCount = 1000, users) {
  console.info("Creating Reports");
  const data = JSON.parse(
    readFileSync(join(process.cwd(), "training-data.json")),
  );
  const reports = [];

  for (let i = 0; i < createReportsCount; i++) {
    const reportData = faker.helpers.arrayElement(data);
    const report = new ReportModel(
      reportData.text,
      faker.location.longitude(),
      faker.location.latitude(),
      faker.helpers.arrayElement(users).id,
      reportData.priority,
    );

    await trySave(report, reports, ReportModel);
  }
  return reports;
}

async function createLostItemReports(createLostItemsCount = 500, users) {
  console.info("Creating Lost Item Reports");
  const lostItems = [];

  for (let i = 0; i < createLostItemsCount; i++) {
    const lostItem = new LostItemModel(
      faker.commerce.productName(),
      faker.commerce.productDescription(),
      faker.string.uuid(),
      faker.color.human(),
      faker.commerce.product(),
      faker.location.longitude(),
      faker.location.latitude(),
      faker.helpers.arrayElement([
        "PENDING",
        "INVESTIGATING",
        "FOUND",
        "CLOSED",
      ]),
      faker.helpers.arrayElement([
        "DENMAN POLICE STATION",
        "NOWENDOC POLICE STATION",
        "WOOLLOOMOOLOO POLICE STATION",
      ]),
      faker.helpers.arrayElement(users).id,
    );

    await trySave(lostItem, lostItems, LostItemModel);
  }
  return lostItems;
}

async function createReportNotes(createReportNotesCount = 500, reports) {
  console.info("Creating Report Notes");
  const notes = [];

  for (let i = 0; i < createReportNotesCount; i++) {
    const note = new NoteModel(
      faker.word.adjective(),
      faker.lorem.text(),
      faker.helpers.arrayElement(reports).id,
      "report",
    );

    await trySave(note, notes, NoteModel);
  }

  return notes;
}

async function createLostItemsNotes(createLostItemNotesCount = 500, lostItems) {
  console.info("Creating Lost Item Notes");
  const notes = [];

  for (let i = 0; i < createLostItemNotesCount; i++) {
    const note = new NoteModel(
      faker.word.adjective(),
      faker.lorem.text(),
      faker.helpers.arrayElement(lostItems).id,
      "lost_article",
    );

    await trySave(note, notes, NoteModel);
  }

  return notes;
}

async function createReportWitnesses(createWitnessesCount = 1500, reports) {
  console.info("Creating Report Witnesses");
  const reportWitnesses = [];

  for (let i = 0; i < createWitnessesCount; i++) {
    const witness = new PersonalDetailsModel(
      faker.person.firstName(),
      faker.person.lastName(),
      faker.date.past().toISOString(),
      faker.phone.number(),
    );

    witness.attachToReport(faker.helpers.arrayElement(reports).id);

    await trySave(witness, reportWitnesses, PersonalDetailsModel);
  }

  return reportWitnesses;
}

async function createLostItemPersonalDetails(
  createPersonalDetailsCount = 200,
  lostItems,
) {
  console.info("Creating Lost Item Personal Details");
  const personalDetails = [];

  for (let i = 0; i < createPersonalDetailsCount; i++) {
    const personalDetail = new PersonalDetailsModel(
      faker.person.firstName(),
      faker.person.lastName(),
      faker.date.past().toISOString(),
      faker.phone.number(),
    );

    personalDetail.attachToLostArticle(
      faker.helpers.arrayElement(lostItems).id,
    );

    await trySave(personalDetail, personalDetails, PersonalDetailsModel);
  }

  return personalDetails;
}

async function createAlerts(createAlertsCount = 350) {
  console.info("Creating Alerts");
  const alerts = [];
  const types = [
    "missing person",
    "dangerous suspect",
    "natural disaster",
    "active shooter",
  ];

  for (let i = 0; i < createAlertsCount; i++) {
    const alert = new AlertModel(
      faker.lorem.word({ length: { min: 5, max: 15 } }),
      faker.lorem.paragraph(),
      faker.helpers.arrayElement(types),
    );

    await trySave(alert, alerts, AlertModel);
  }

  return alerts;
}

async function run() {
  const users = await createUsers(1000);
  await createOfficers();
  const reports = await createReports(1500, users);
  const lostItems = await createLostItemReports(600, users);
  await createReportNotes(500, reports);
  await createLostItemsNotes(500, lostItems);
  await createReportWitnesses(1500, reports);
  await createLostItemPersonalDetails(200, lostItems);
  await createAlerts();
  
  console.info('Failure Amount');
  console.table(failures);
}

run();
