process.env.NODE_ENV = 'test';

const { Sequelize, DataTypes } = require('sequelize');
const nodemailer = require('nodemailer');

test('Sequelize UUID defaults and transaction identifiers survive the uuid security override', async () => {
  const database = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Record = database.define('UuidCompatibility', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV1, primaryKey: true },
    publicId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
    label: DataTypes.STRING,
  }, { timestamps: false });
  try {
    await database.sync();
    const record = await database.transaction(async transaction => {
      expect(transaction.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      return Record.create({ label: 'Identifiants conservés' }, { transaction });
    });
    expect(record.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(record.publicId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect((await Record.findByPk(record.id)).publicId).toBe(record.publicId);
    await expect(database.transaction(async transaction => {
      await Record.create({ label: 'À annuler' }, { transaction });
      throw new Error('rollback de vérification');
    })).rejects.toThrow('rollback de vérification');
    expect(await Record.count()).toBe(1);
  } finally {
    await database.close();
  }
});

test('Nodemailer CommonJS transport composes UTF-8 maintenance mail without a network connection', async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  try {
    const info = await transport.sendMail({
      from: 'CarCare <garage@example.com>',
      to: 'Conducteur <driver@example.com>',
      subject: 'Rappel : révision à prévoir',
      text: 'Le prochain entretien est prévu à 15 000 km.',
      html: '<p>Le prochain <strong>entretien</strong> est prévu à 15 000 km.</p>',
    });
    const message = info.message.toString('utf8');
    expect(info.envelope.from).toBe('garage@example.com');
    expect(info.envelope.to).toEqual(['driver@example.com']);
    expect(message).toContain('MIME-Version: 1.0');
    expect(message).toMatch(/Content-Type: multipart\/alternative/);
    expect(message).toContain('text/plain; charset=utf-8');
    expect(message).toContain('text/html; charset=utf-8');
    expect(message).toMatch(/Subject: =\?UTF-8\?/i);
  } finally {
    transport.close();
  }
});
