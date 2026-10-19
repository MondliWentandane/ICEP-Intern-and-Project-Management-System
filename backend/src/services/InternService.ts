import internRepository, {
  InternFilters,
} from "../repositories/InternRepository";

class InternService {
  async getAllInterns(filters: InternFilters = {}) {
    return internRepository.findAll(filters);
  }

  async getInternById(id: string) {
    if (!id || id.trim() === "") {
      throw new Error("Intern ID is required.");
    }

    const intern = await internRepository.findById(id);

    if (!intern) {
      throw new Error("Intern not found.");
    }

    return intern;
  }
}

export default new InternService();