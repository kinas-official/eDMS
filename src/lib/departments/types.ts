export interface DepartmentMember {
	id: number;
	name: string;
	email: string;
}

export interface Department {
	id: number;
	name: string;
	description: string;
	members: DepartmentMember[];
	createdAt: string;
}
