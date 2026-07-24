import { fetchActiveTemplatesService } from '../../src/lib/services/document-template.service';
import { prisma } from '../../src/lib/prisma';
import { checkUserAccess } from '../../src/lib/accessControl';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    documentTemplate: {
      findMany: jest.fn()
    }
  }
}));

jest.mock('../../src/lib/accessControl', () => ({
  checkUserAccess: jest.fn()
}));

describe('fetchActiveTemplatesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Active-template retrieval uses the shared server service directly', async () => {
    (checkUserAccess as jest.Mock).mockResolvedValue({ allowed: true });
    (prisma.documentTemplate.findMany as jest.Mock).mockResolvedValue([{ id: '1', templateName: 'Test' }]);
    
    const result = await fetchActiveTemplatesService('actor-1', 'proj-1');
    expect(result).toHaveLength(1);
    expect(prisma.documentTemplate.findMany).toHaveBeenCalled();
  });

  it('4. Unauthenticated access is rejected', async () => {
    await expect(fetchActiveTemplatesService('')).rejects.toThrow('Unauthorized: Missing actor id');
  });

  it('5. Unauthorized roles are rejected', async () => {
    (checkUserAccess as jest.Mock).mockResolvedValue({ allowed: false, denialReason: 'Role not permitted' });
    await expect(fetchActiveTemplatesService('actor-1')).rejects.toThrow('Unauthorized: Role rejected or project isolation enforced');
  });

  it('6. Project isolation remains enforced', async () => {
    (checkUserAccess as jest.Mock).mockResolvedValue({ allowed: true });
    await fetchActiveTemplatesService('actor-1', 'proj-1');
    
    expect(prisma.documentTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { projectId: null },
            { projectId: 'proj-1' }
          ]
        })
      })
    );
  });

  it('7. Authorized retrieval returns the expected templates', async () => {
    const mockTemplates = [
      { id: '1', templateName: 'Global', projectId: null },
      { id: '2', templateName: 'Project Specific', projectId: 'proj-1' }
    ];
    (checkUserAccess as jest.Mock).mockResolvedValue({ allowed: true });
    (prisma.documentTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);
    
    const result = await fetchActiveTemplatesService('actor-1', 'proj-1');
    expect(result).toEqual(mockTemplates);
  });
});
