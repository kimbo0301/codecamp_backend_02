import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateProductInput {
    @Field(() => String)
    name: string;

    @Field(() => Int)
    price: number;
}
