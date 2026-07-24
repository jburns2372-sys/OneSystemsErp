"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var schedule_workflow_service_1 = require("./src/lib/services/schedule-workflow.service");
var prisma = new client_1.PrismaClient();
function runTest() {
    return __awaiter(this, void 0, void 0, function () {
        var projectId, scheduleId, manager, actor, scheduleBefore, expectedRowVersion, result, error_1, error_2, scheduleAfter, approvalCount, types, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectId = 'cmrirhhw30000ic0406v47smb';
                    scheduleId = '641f4c56e72847e6a5e3288d0';
                    console.log('Testing explicit Manager Comment Gateway...');
                    return [4 /*yield*/, prisma.user.findUnique({ where: { email: 'manager@onesystemserp.com' } })];
                case 1:
                    manager = _a.sent();
                    if (!manager) {
                        console.error('Manager not found');
                        return [2 /*return*/];
                    }
                    actor = {
                        userId: manager.id,
                        email: manager.email || '',
                        sessionVersion: 1,
                        accountActive: true,
                        accountLocked: false,
                        mustChangePassword: false
                    };
                    return [4 /*yield*/, prisma.projectSchedule.findUnique({
                            where: { id: scheduleId }
                        })];
                case 2:
                    scheduleBefore = _a.sent();
                    if (!scheduleBefore) {
                        console.error('Schedule not found');
                        return [2 /*return*/];
                    }
                    expectedRowVersion = scheduleBefore.rowVersion;
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, schedule_workflow_service_1.addRequiredReviewComments)(projectId, scheduleId, expectedRowVersion, actor)];
                case 4:
                    result = _a.sent();
                    console.log('Initial creation:', result.status);
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.log('Initial creation failed:', error_1.message);
                    return [3 /*break*/, 6];
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, (0, schedule_workflow_service_1.addRequiredReviewComments)(projectId, scheduleId, expectedRowVersion, actor)];
                case 7:
                    _a.sent();
                    console.log('Duplicate test failed: Should have thrown');
                    return [3 /*break*/, 9];
                case 8:
                    error_2 = _a.sent();
                    console.log('Duplicate correctly rejected:', error_2.message);
                    return [3 /*break*/, 9];
                case 9: return [4 /*yield*/, prisma.projectSchedule.findUnique({
                        where: { id: scheduleId },
                        include: {
                            reviewComments: true,
                            baselineActivations: true,
                            workflowTransitions: true
                        }
                    })];
                case 10:
                    scheduleAfter = _a.sent();
                    return [4 /*yield*/, prisma.scheduleApproval.count({
                            where: { scheduleId: scheduleId }
                        })];
                case 11:
                    approvalCount = _a.sent();
                    console.log('Comments Count:', scheduleAfter.reviewComments.length);
                    if (scheduleAfter.reviewComments.length > 0) {
                        types = scheduleAfter.reviewComments.map(function (c) { return c.commentType; }).sort();
                        console.log('Comment Types:', types.join(', '));
                        console.log('Comment Actor:', manager.email);
                        console.log('Comment Actor Role:', scheduleAfter.reviewComments[0].createdByRoleSnapshot);
                    }
                    console.log('workflowStatus:', scheduleAfter.workflowStatus);
                    console.log('rowVersion:', scheduleAfter.rowVersion);
                    console.log('transition count:', scheduleAfter.workflowTransitions.length);
                    console.log('approval count:', approvalCount);
                    console.log('baseline count:', scheduleAfter.baselineActivations.length);
                    _a.label = 12;
                case 12:
                    _a.trys.push([12, 14, , 15]);
                    return [4 /*yield*/, prisma.scheduleReviewComment.create({
                            data: {
                                projectId: projectId,
                                scheduleId: scheduleId,
                                createdById: manager.id,
                                createdByRoleSnapshot: 'PROJECT_MANAGER',
                                createdByNameSnapshot: 'Test',
                                commentType: 'TECHNICAL',
                                reviewRound: 1,
                                comment: 'Direct write test'
                            }
                        })];
                case 13:
                    _a.sent();
                    console.log('Direct write: ALLOWED (FAIL)');
                    return [3 /*break*/, 15];
                case 14:
                    error_3 = _a.sent();
                    console.log('Direct write:', error_3.message.includes('GATE9D_DIRECT_MUTATION_REJECTED') ? 'REJECTED' : error_3.message);
                    return [3 /*break*/, 15];
                case 15:
                    console.log('Reverting...');
                    return [4 /*yield*/, prisma.scheduleReviewComment.deleteMany({
                            where: { scheduleId: scheduleId }
                        })];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, prisma.auditLog.deleteMany({
                            where: {
                                actionType: 'SCHEDULE_REVIEW_COMMENTS_ADDED',
                                userId: manager.id
                            }
                        })];
                case 17:
                    _a.sent();
                    console.log('Revert completed.');
                    return [2 /*return*/];
            }
        });
    });
}
runTest()
    .catch(console.error)
    .finally(function () { return prisma.$disconnect(); });
